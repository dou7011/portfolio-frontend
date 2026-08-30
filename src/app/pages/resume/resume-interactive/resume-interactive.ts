import { AfterViewInit, Component, HostListener } from '@angular/core';

type Lang = 'zh' | 'en';

@Component({
  selector: 'app-resume-interactive',
  standalone: true,
  templateUrl: './resume-interactive.html',
  styleUrl: './resume-interactive.css',
})
export class ResumeInteractiveComponent implements AfterViewInit {
  currentLang: Lang = 'zh';

  private readonly dict = {
    zh: {
      badge: 'System Architecture & Full-Stack',
      name: '林和泰',
      summary:
        '我是林和泰。過去擁有七年的機械領域經驗，因為對程式設計有極大的熱忱，我利用下班時間學習，後來決定轉換跑道進入勤益科大資訊工程系就讀。',
      expLabel: 'EXPERIENCE',
      skillLabel: 'TECHNICAL ARSENAL',
      eduLabel: 'EDUCATION',
      certLabel: 'CERTIFICATIONS',
      jobDate1: '2023/09 - 2026/09',
      jobTitle1: '實習生',
      company1: '向上國際科技股份有限公司',
      jobDesc1:
        '前期負責設備整備、資產管理與推行資安宣導，並學習機房、雲端服務與VM建置。後期投入全端開發。',
      jobDate2: '2015/03 - 2022/07',
      jobTitle2: '組立修配人員',
      company2: '岳群機械有限公司',
      jobDesc2: '負責客製化包裝機之組立與測試調校，具備機械故障排除與設備優化的實務能力。',
      cat1: '程式語言',
      cat2: '前端技術',
      cat3: '後端技術',
      cat4: '開發與部署',
      cat5: '資料庫',
      degree: '資訊工程系學士 畢業',
      school: '國立勤益科技大學',
      degreeMaster: '資訊工程系 碩士在職專班',
      schoolMaster: '國立勤益科技大學',
      certDesc1: '於 Azure 應用資料科學與機器學習技術。',
      certDesc2: '熟悉雲端運算核心概念。',
    },
    en: {
      badge: 'System Architecture & Full-Stack',
      name: 'He-Tai Lin',
      summary:
        "I'm He-Tai Lin. With 7 years of background in mechanical engineering, my passion for programming drove me to study after hours, eventually leading me to pivot my career and pursue a degree in Computer Science at NCUT.",
      expLabel: 'EXPERIENCE',
      skillLabel: 'TECHNICAL ARSENAL',
      eduLabel: 'EDUCATION',
      certLabel: 'CERTIFICATIONS',
      jobDate1: 'Sep 2023 - Sep 2026',
      jobTitle1: 'Software Intern',
      company1: 'Xiang Shang Games Co., Ltd.',
      jobDesc1:
        'Initially handled equipment prep, asset management, and security awareness. Later shifted focus to full-stack web development.',
      jobDate2: 'Mar 2015 - Jul 2022',
      jobTitle2: 'Assembly Technician',
      company2: 'Yue Qun Machinery Co., Ltd.',
      jobDesc2:
        'Responsible for assembly and tuning of custom packaging machines with hands-on mechanical troubleshooting skills.',
      cat1: 'Languages',
      cat2: 'Frontend',
      cat3: 'Backend',
      cat4: 'DevOps',
      cat5: 'Database',
      degree: 'B.S. in Computer Science',
      school: 'National Chin-Yi University of Technology',
      degreeMaster: 'M.S. in Computer Science',
      schoolMaster: 'National Chin-Yi University of Technology',
      certDesc1: 'Applied data science and machine learning on Microsoft Azure.',
      certDesc2: 'Familiar with core cloud computing concepts.',
    },
  } as const;

  get t() {
    return this.dict[this.currentLang];
  }

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  }

  toggleLang(): void {
    this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
  }

  @HostListener('window:mousemove', ['$event'])
  onWindowMouseMove(event: MouseEvent): void {
    const globalGlow = document.querySelector('.mouse-glow') as HTMLElement | null;
    if (!globalGlow) {
      return;
    }

    requestAnimationFrame(() => {
      globalGlow.style.setProperty('--cursor-x', `${event.clientX}px`);
      globalGlow.style.setProperty('--cursor-y', `${event.clientY}px`);
    });
  }

  onCardMouseMove(event: MouseEvent, card: HTMLElement): void {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }

  onCardMouseLeave(card: HTMLElement): void {
    card.style.setProperty('--mouse-x', '-100%');
    card.style.setProperty('--mouse-y', '-100%');
  }
}
