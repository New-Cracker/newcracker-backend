// news/company.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async findById(id: number): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException('존재하지 않는 회사입니다.');
    return company;
  }

  async findByNameOrNull(name: string): Promise<Company | null> {
    return this.companyRepository.findOne({ where: { name } });
  }

  async findOrCreate(name: string, originallink: string): Promise<Company> {
    const existing = await this.findByNameOrNull(name);
    if (existing) return existing;

    const homepageUrl = this.extractHomepageUrl(originallink);
    const company = this.companyRepository.create({ name, homepageUrl });
    return this.companyRepository.save(company);
  }

  private extractHomepageUrl(originallink: string): string {
    try {
      const url = new URL(originallink);
      return `${url.protocol}//${url.hostname}`;
    } catch {
      return originallink;
    }
  }
}
