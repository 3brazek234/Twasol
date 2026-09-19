import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateJob } from '../../../hooks/useJobs';
import { useAllCourts } from '../../../hooks/useCourts';

type CourtType = 'PARTIAL' | 'PRIMARY' | 'APPEAL' | 'CASSATION';

export interface SelectedCourt {
  id: string;
  nameAr: string;
  type: CourtType;
  cityAr?: string;
}

export const postJobSchema = z.object({
  title: z.string().min(5, 'يجب أن يكون العنوان ٥ أحرف على الأقل'),
  description: z.string().min(10, 'يجب أن يكون الوصف ١٠ أحرف على الأقل'),
  courtId: z.string().uuid('يرجى اختيار المحكمة'),
  taskType: z.enum(['ATTEND_SESSION', 'OBTAIN_DOCUMENT', 'FILE_PLEADING', 'REGISTER_PROPERTY', 'REVIEW_DOCKET', 'OTHER'], {
    message: 'يرجى اختيار نوع المهمة',
  }),
  invitedLawyerId: z.string().uuid('معرف المحامي غير صالح').or(z.literal('')).optional(),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  expiresInHours: z.number().nullable().optional(),
}).refine(data => {
  if (data.salaryMin && data.salaryMax) {
    return parseFloat(data.salaryMin) <= parseFloat(data.salaryMax);
  }
  return true;
}, {
  message: "الحد الأدنى للأتعاب يجب أن يكون أقل من الحد الأقصى",
  path: ["salaryMax"]
});

export type PostJobFormData = z.infer<typeof postJobSchema>;

export const usePostJob = () => {
  const [step, setStep] = useState(1);
  const [selectedCourt, setSelectedCourt] = useState<SelectedCourt | null>(null);

  const { control, handleSubmit, formState: { errors }, trigger, setValue } = useForm<PostJobFormData>({
    resolver: zodResolver(postJobSchema),
    defaultValues: {
      courtId: '',
      expiresInHours: null,
    }
  });

  const { mutate: createJob, isPending } = useCreateJob();
  const formData = useWatch({ control });

  // When a court is selected from the picker, update both local state and form value
  const handleCourtSelected = (court: SelectedCourt) => {
    setSelectedCourt(court);
    setValue('courtId', court.id, { shouldValidate: true });
  };

  return {
    step, setStep,
    selectedCourt, handleCourtSelected,
    control, handleSubmit, errors, trigger, setValue,
    createJob, isPending, formData,
  };
};
