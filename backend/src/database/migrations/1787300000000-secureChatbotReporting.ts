import { MigrationInterface, QueryRunner } from 'typeorm';

const REPORTING_VIEWS = [
  'chatbot_report_users_view',
  'chatbot_report_coach_profiles_view',
  'chatbot_report_audit_view',
  'chatbot_report_appointments_view',
  'chatbot_report_doctor_schedules_view',
  'chatbot_report_doctors_view',
  'chatbot_report_specialties_view',
] as const;

export class SecureChatbotReporting1787300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const chatbotDbPassword = process.env.CHATBOT_DB_PASSWORD;
    if (!chatbotDbPassword || chatbotDbPassword.length < 16) {
      throw new Error(
        'CHATBOT_DB_PASSWORD must be configured with at least 16 characters',
      );
    }

    const [escapedPassword] = await queryRunner.query(
      'SELECT quote_literal($1) AS value',
      [chatbotDbPassword],
    );
    await queryRunner.query(
      `ALTER ROLE chatbot_readonly WITH LOGIN PASSWORD ${escapedPassword.value}`,
    );
    await queryRunner.query(
      'ALTER ROLE chatbot_readonly SET default_transaction_read_only TO on',
    );
    await queryRunner.query(
      `ALTER ROLE chatbot_readonly SET statement_timeout TO '15s'`,
    );
    await queryRunner.query(
      'REVOKE CREATE ON SCHEMA public FROM chatbot_readonly',
    );
    await queryRunner.query(`
      CREATE OR REPLACE VIEW chatbot_report_users_view
      WITH (security_barrier = true) AS
      WITH deidentified AS (
        SELECT
          u.created_at::date AS registration_date,
          CASE
            WHEN u.gender IS TRUE THEN 'male'
            WHEN u.gender IS FALSE THEN 'female'
            ELSE 'unknown'
          END AS gender,
          CASE
            WHEN u.date_of_birth IS NULL THEN 'unknown'
            WHEN DATE_PART('year', AGE(CURRENT_DATE, u.date_of_birth)) < 18 THEN 'under_18'
            WHEN DATE_PART('year', AGE(CURRENT_DATE, u.date_of_birth)) < 30 THEN '18_29'
            WHEN DATE_PART('year', AGE(CURRENT_DATE, u.date_of_birth)) < 45 THEN '30_44'
            WHEN DATE_PART('year', AGE(CURRENT_DATE, u.date_of_birth)) < 60 THEN '45_59'
            ELSE '60_plus'
          END AS age_group,
          CASE
            WHEN COALESCE(u.address, '') ~ '[,;-]'
            THEN NULLIF(
              BTRIM(REGEXP_REPLACE(u.address, '^.*[,;-][[:space:]]*', '')),
              ''
            )
            ELSE NULL
          END AS region,
          COALESCE((
            SELECT STRING_AGG(DISTINCT r.role_name, ', ' ORDER BY r.role_name)
            FROM user_roles ur
            INNER JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id
              AND ur.deleted_at IS NULL
              AND r.deleted_at IS NULL
          ), 'unassigned') AS roles
        FROM users u
        WHERE u.deleted_at IS NULL
      )
      SELECT
        registration_date,
        gender,
        age_group,
        region,
        roles,
        COUNT(*)::int AS user_count
      FROM deidentified
      GROUP BY registration_date, gender, age_group, region, roles
    `);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW chatbot_report_coach_profiles_view
      WITH (security_barrier = true) AS
      SELECT
        created_at::date AS profile_date,
        health_goal,
        COUNT(*)::int AS profile_count,
        CASE WHEN COUNT(age) >= 5 THEN ROUND(AVG(age)::numeric, 2) END AS average_age,
        CASE WHEN COUNT(height) >= 5 THEN ROUND(AVG(height)::numeric, 2) END AS average_height,
        CASE WHEN COUNT(weight) >= 5 THEN ROUND(AVG(weight)::numeric, 2) END AS average_weight
      FROM coach_profile
      WHERE deleted_at IS NULL
      GROUP BY created_at::date, health_goal
    `);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW chatbot_report_audit_view
      WITH (security_barrier = true) AS
      SELECT
        created_at::date AS activity_date,
        action,
        entity_name,
        is_success,
        COUNT(*)::int AS event_count,
        COUNT(DISTINCT user_id)::int AS actor_count
      FROM audit_log
      GROUP BY created_at::date, action, entity_name, is_success
    `);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW chatbot_report_appointments_view
      WITH (security_barrier = true) AS
      SELECT
        appointment_date::date AS appointment_date,
        status,
        booking_mode,
        doctor_schedule_id,
        COUNT(*)::int AS appointment_count
      FROM appointments
      WHERE deleted_at IS NULL
      GROUP BY appointment_date::date, status, booking_mode, doctor_schedule_id
    `);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW chatbot_report_doctor_schedules_view
      WITH (security_barrier = true) AS
      SELECT id, doctor_id, day_of_week, start_time, end_time, is_active
      FROM doctor_schedules
    `);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW chatbot_report_doctors_view
      WITH (security_barrier = true) AS
      SELECT
        d.id,
        u.fullname AS doctor_name,
        d.specialty_id,
        s.name AS specialty_name,
        d.created_at
      FROM doctors d
      INNER JOIN users u ON u.id = d.user_id AND u.deleted_at IS NULL
      LEFT JOIN specialties s ON s.id = d.specialty_id AND s.deleted_at IS NULL
      WHERE d.deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW chatbot_report_specialties_view
      WITH (security_barrier = true) AS
      SELECT id, name, created_at
      FROM specialties
      WHERE deleted_at IS NULL
    `);

    for (const view of REPORTING_VIEWS) {
      await queryRunner.query(`GRANT SELECT ON ${view} TO chatbot_readonly`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const view of [...REPORTING_VIEWS].reverse()) {
      await queryRunner.query(`DROP VIEW IF EXISTS ${view}`);
    }
  }
}
