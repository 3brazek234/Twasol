import { JobsCreationService } from './jobs.creation.service';
import { JobsQueryService } from './jobs.query.service';
import { JobsLifecycleService } from './jobs.lifecycle.service';

export class JobsService {
  static create = JobsCreationService.create;
  
  static list = JobsQueryService.list;
  static getById = JobsQueryService.getById;
  static getMyJobs = JobsQueryService.getMyJobs;
  static getJobsByLawyerId = JobsQueryService.getJobsByLawyerId;
  
  static apply = JobsLifecycleService.apply;
  static updateStatus = JobsLifecycleService.updateStatus;
  static delete = JobsLifecycleService.delete;
  static translate = JobsLifecycleService.translate;
}
