import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ResumeService } from '../../../services/resume.service';
import { ResumeData } from '../../../models/resume.interface';

@Component({
  selector: 'app-resume-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './resume-edit.html',
  styleUrl: './resume-edit.css'
})
export class ResumeEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private resumeService = inject(ResumeService);

  public currentLang: 'zh' | 'en' = 'zh';
  public isLoading = false;
  public isSaving = false;
  public saveMessage = '';
  public saveError = '';

  public resumeForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    summary: ['', Validators.required],
    skills: this.fb.array([]),
    experience: this.fb.array([]),
    education: this.fb.array([]),
    certifications: this.fb.array([]),
  });

  get skills(): FormArray { return this.resumeForm.get('skills') as FormArray; }
  get experience(): FormArray { return this.resumeForm.get('experience') as FormArray; }
  get education(): FormArray { return this.resumeForm.get('education') as FormArray; }
  get certifications(): FormArray { return this.resumeForm.get('certifications') as FormArray; }

  getSkillItems(skillIndex: number): FormArray {
    return this.skills.at(skillIndex).get('items') as FormArray;
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
    this.saveMessage = '';
    this.saveError = '';
    this.resumeService.getResumeData(this.currentLang).subscribe({
      next: (res: any) => {
        const data: ResumeData = res.data;
        this.skills.clear();
        this.experience.clear();
        this.education.clear();
        this.certifications.clear();

        this.resumeForm.patchValue({ title: data.title, summary: data.summary });

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

        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
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

  // ── Submit ───────────────────────────────────────────────
  onSubmit() {
    if (this.resumeForm.invalid) {
      this.resumeForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    this.saveMessage = '';
    this.saveError = '';

    const rawValue = this.resumeForm.getRawValue();
    const payload = {
      ...rawValue,
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
    };

    this.resumeService.updateResume(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.saveMessage = '🎉 儲存成功！';
        setTimeout(() => (this.saveMessage = ''), 3000);
      },
      error: (err: any) => {
        this.isSaving = false;
        this.saveError = err?.error?.error ?? '儲存失敗，請稍後再試。';
      },
    });
  }
}