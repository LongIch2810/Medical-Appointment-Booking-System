import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import AiAdminReport from './aiAdminReport.entity';
import AiReportConversation from './aiReportConversation.entity';

export type ReportAssistantAction =
  'CLARIFY' | 'ANSWER' | 'PROPOSE_PLAN' | 'GENERATE_REPORT' | 'REFUSE';

export type ReportPlan = {
  schemaVersion: 1;
  title: string;
  objective: string;
  query: string;
  fromDate: string;
  toDate: string;
  comparisonFromDate?: string | null;
  comparisonToDate?: string | null;
  metrics: string[];
  groupBy: string[];
  sourceViews: string[];
  chartType?: 'AUTO' | 'BAR' | 'LINE' | 'PIE' | 'TABLE';
  detailLevel?: 'BRIEF' | 'STANDARD' | 'DETAILED';
  appliedPreferences?: {
    rangePreset?: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR';
    comparison?: 'NONE' | 'PREVIOUS_PERIOD' | 'PREVIOUS_YEAR';
    metrics?: string[];
    groupBy?: string[];
    chartType?: 'AUTO' | 'BAR' | 'LINE' | 'PIE' | 'TABLE';
    detailLevel?: 'BRIEF' | 'STANDARD' | 'DETAILED';
  };
};

@Entity('ai_report_messages')
@Index('IDX_ai_report_messages_conversation_id', ['conversation', 'id'])
export default class AiReportMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(
    () => AiReportConversation,
    (conversation) => conversation.messages,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Relation<AiReportConversation>;

  @Column({ type: 'varchar', length: 16 })
  role!: 'USER' | 'ASSISTANT';

  @Column({ type: 'varchar', length: 32, nullable: true })
  action!: ReportAssistantAction | null;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'jsonb', nullable: true })
  plan!: ReportPlan | null;

  @ManyToOne(() => AiAdminReport, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'report_id' })
  report!: Relation<AiAdminReport> | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
