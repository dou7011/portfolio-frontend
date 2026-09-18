import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { ResumeService } from '../../../services/resume.service';
import { ToastService } from '../../../services/toast.service';
import { ApiError } from '../../../models/api.interface';

@Component({
  selector: 'app-resume-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './resume-edit.html',
  styleUrl: './resume-edit.css'
})
export class ResumeEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private resumeService = inject(ResumeService);
  private toastService = inject(ToastService);

  public currentLang: 'zh' | 'en' = 'zh';
  public isLoading = false;
  public isSaving = false;
  public saveError = '';
  public readonly projectEditorModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      ['link'],
      ['clean'],
    ],
  };

  public resumeForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    email: [''],
    github: [''],
    summary: ['', Validators.required],
    skills: this.fb.array([]),
    experience: this.fb.array([]),
    education: this.fb.array([]),
    certifications: this.fb.array([]),
    projects: this.fb.array([]),
  });

  get skills(): FormArray { return this.resumeForm.get('skills') as FormArray; }
  get experience(): FormArray { return this.resumeForm.get('experience') as FormArray; }
  get education(): FormArray { return this.resumeForm.get('education') as FormArray; }
  get certifications(): FormArray { return this.resumeForm.get('certifications') as FormArray; }
  get projects(): FormArray { return this.resumeForm.get('projects') as FormArray; }

  getSkillItems(skillIndex: number): FormArray {
    return this.skills.at(skillIndex).get('items') as FormArray;
  }

  getProjectTechStack(projectIndex: number): FormArray {
    return this.projects.at(projectIndex).get('techStack') as FormArray;
  }

  private normalizeDateForInput(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const match = value.match(/^(\d{4})[\/\-](\d{2})$/);
    return match ? `${match[1]}-${match[2]}` : '';
  }

  private normalizeDateForSave(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return value.replace(/-/g, '/');
  }

  ngOnInit() {
    this.loadResumeData();
  }

  switchLang(lang: 'zh' | 'en') {
    if (this.currentLang === lang) return;
    this.currentLang = lang;
    this.loadResumeData();
  }

  loadResumeData() {
    this.isLoading = true;
    this.saveError = '';
    this.resumeService.getResumeData(this.currentLang).subscribe({
      next: (res) => {
        const data = res.data;
        if (!data) {
          this.saveError = '目前沒有可編輯的履歷資料。';
          this.isLoading = false;
          return;
        }
        this.skills.clear();
        this.experience.clear();
        this.education.clear();
        this.certifications.clear();
        this.projects.clear();

        this.resumeForm.patchValue({ title: data.title, email: data.email ?? '', github: data.github ?? '', summary: data.summary });

        (data.skills ?? []).forEach(s => {
          const itemsArray = this.fb.array(
            (s.items ?? []).map(i => this.fb.control(i, Validators.required))
          );
          this.skills.push(this.fb.group({ category: [s.category, Validators.required], items: itemsArray }));
        });

        (data.experience ?? []).forEach(e => {
          this.experience.push(this.fb.group({
            company: [e.company, Validators.required],
            title: [e.title, Validators.required],
            startDate: [this.normalizeDateForInput(e.startDate)],
            endDate: [this.normalizeDateForInput(e.endDate)],
            description: [e.description],
          }));
        });

        (data.education ?? []).forEach(e => {
          this.education.push(this.fb.group({
            school: [e.school, Validators.required],
            degree: [e.degree],
            startDate: [this.normalizeDateForInput(e.startDate)],
            endDate: [this.normalizeDateForInput(e.endDate)],
          }));
        });

        (data.certifications ?? []).forEach(c => {
          this.certifications.push(this.fb.group({
            name: [c.name, Validators.required],
            credentialId: [c.credentialId],
            description: [c.description],
          }));
        });

        (data.projects ?? []).forEach(p => {
          const techStackArray = this.fb.array(
            (p.techStack ?? []).map(t => this.fb.control(t, Validators.required))
          );
          this.projects.push(this.fb.group({
            name: [p.name, Validators.required],
            description: [p.description],
            techStack: techStackArray,
            githubUrl: [p.githubUrl ?? ''],
            demoUrl: [p.demoUrl ?? ''],
          }));
        });

        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        const apiError = err.error as ApiError | undefined;
        this.saveError = apiError?.message ?? '載入履歷失敗，請稍後再試。';
        this.isLoading = false;
      }
    });
  }

  // ── Skills ──────────────────────────────────────────────
  addSkill() {
    this.skills.push(this.fb.group({ category: ['', Validators.required], items: this.fb.array([this.fb.control('', Validators.required)]) }));
  }
  removeSkill(i: number) { this.skills.removeAt(i); }
  addSkillItem(i: number) { this.getSkillItems(i).push(this.fb.control('', Validators.required)); }
  removeSkillItem(si: number, ii: number) { this.getSkillItems(si).removeAt(ii); }

  // ── Experience ───────────────────────────────────────────
  addExperience() {
    this.experience.push(this.fb.group({ company: ['', Validators.required], title: ['', Validators.required], startDate: [''], endDate: [''], description: [''] }));
  }
  removeExperience(i: number) { this.experience.removeAt(i); }

  // ── Education ────────────────────────────────────────────
  addEducation() {
    this.education.push(this.fb.group({ school: ['', Validators.required], degree: [''], startDate: [''], endDate: [''] }));
  }
  removeEducation(i: number) { this.education.removeAt(i); }

  // ── Certifications ───────────────────────────────────────
  addCertification() {
    this.certifications.push(this.fb.group({ name: ['', Validators.required], credentialId: [''], description: [''] }));
  }
  removeCertification(i: number) { this.certifications.removeAt(i); }

  // ── Projects ─────────────────────────────────────────────
  addProject() {
    this.projects.push(this.fb.group({
      name: ['', Validators.required],
      description: [''],
      techStack: this.fb.array([this.fb.control('', Validators.required)]),
      githubUrl: [''],
      demoUrl: [''],
    }));
  }
  removeProject(i: number) { this.projects.removeAt(i); }
  addProjectTech(i: number) { this.getProjectTechStack(i).push(this.fb.control('', Validators.required)); }
  removeProjectTech(pi: number, ti: number) { this.getProjectTechStack(pi).removeAt(ti); }

  // ── Submit ───────────────────────────────────────────────
  onSubmit() {
    if (this.resumeForm.invalid) {
      this.resumeForm.markAllAsTouched();
      this.toastService.show('請確認表單內容是否填寫完整。', 'error', '儲存失敗');
      return;
    }
    this.isSaving = true;
    this.saveError = '';

    const rawValue = this.resumeForm.getRawValue();
    const payload = {
      lang: this.currentLang,
      title: rawValue.title,
      email: rawValue.email,
      github: rawValue.github,
      summary: rawValue.summary,
      skills: rawValue.skills ?? [],
      experience: (rawValue.experience ?? []).map((exp: any) => ({
        ...exp,
        startDate: this.normalizeDateForSave(exp.startDate),
        endDate: this.normalizeDateForSave(exp.endDate),
      })),
      education: (rawValue.education ?? []).map((edu: any) => ({
        ...edu,
        startDate: this.normalizeDateForSave(edu.startDate),
        endDate: this.normalizeDateForSave(edu.endDate),
      })),
      certifications: rawValue.certifications ?? [],
      projects: rawValue.projects ?? [],
    };

    this.resumeService.updateResume(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.show('履歷內容已成功更新。', 'success', '更新成功');
        this.loadResumeData();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving = false;
        const apiError = err.error as ApiError | undefined;
        this.saveError = apiError?.message ?? '儲存失敗，請稍後再試。';
        this.toastService.show(this.saveError, 'error', '更新失敗');
      },
    });
  }
}