import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import Complaint, { ComplaintStatus } from 'src/entities/complaint.entity';
import { Repository } from 'typeorm';
import { BodyCreateComplaintDto } from './dto/request/bodyCreateComplaint.dto';
import { BodyFilterComplaintsDto } from './dto/request/bodyFilterComplaints.dto';
import { BodyUpdateComplaintDto } from './dto/request/bodyUpdateComplaint.dto';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepo: Repository<Complaint>,
  ) {}

  async create(body: BodyCreateComplaintDto) {
    const complaint = this.complaintRepo.create({
      title: body.title,
      description: body.description,
      complaint_status: ComplaintStatus.PENDING,
      user: body.userId ? { id: body.userId } : null,
    });

    return this.complaintRepo.save(complaint);
  }

  async filterAndPagination(objectFilters: BodyFilterComplaintsDto) {
    let { page, limit } = objectFilters;
    const { search, status, userId, fromDate, toDate, arrange } = objectFilters;
    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Number(limit) || 10);
    const skip = (page - 1) * limit;

    const query = this.complaintRepo
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.user', 'user')
      .orderBy('complaint.created_at', arrange.toUpperCase() as 'ASC' | 'DESC')
      .skip(skip)
      .take(limit);

    if (search) {
      query.andWhere(
        '(complaint.title ILIKE :search OR complaint.description ILIKE :search OR user.email ILIKE :search OR user.fullname ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      query.andWhere('complaint.complaint_status = :status', { status });
    }

    if (userId) {
      query.andWhere('user.id = :userId', { userId });
    }

    if (fromDate) {
      query.andWhere('complaint.created_at >= :fromDate', {
        fromDate: new Date(fromDate),
      });
    }

    if (toDate) {
      query.andWhere('complaint.created_at <= :toDate', {
        toDate: new Date(toDate),
      });
    }

    const [complaints, total] = await query.getManyAndCount();
    return new PaginationResultDto(
      'complaints',
      complaints,
      total,
      page,
      limit,
    );
  }

  async findById(complaintId: number) {
    const complaint = await this.complaintRepo.findOne({
      where: { id: complaintId },
      relations: ['user'],
    });

    if (!complaint) {
      throw new NotFoundException('Phản hồi không tồn tại.');
    }

    return complaint;
  }

  async update(complaintId: number, body: BodyUpdateComplaintDto) {
    const complaint = await this.findById(complaintId);

    if (body.title !== undefined) {
      complaint.title = body.title;
    }

    if (body.description !== undefined) {
      complaint.description = body.description;
    }

    if (body.status !== undefined) {
      complaint.complaint_status = body.status;
    }

    if (body.response !== undefined) {
      complaint.response = body.response;
    }

    return this.complaintRepo.save(complaint);
  }

  async remove(complaintId: number) {
    await this.findById(complaintId);
    await this.complaintRepo.softDelete(complaintId);
    return { message: 'Xóa phản hồi thành công.' };
  }
}
