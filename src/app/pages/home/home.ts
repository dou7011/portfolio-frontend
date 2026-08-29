import { AfterViewInit, Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealElements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.transitionDelay = `${Math.min(index * 55, 280)}ms`;
      observer.observe(htmlElement);
    });

    const orb = document.querySelector('.hero-orb') as HTMLElement | null;
    if (window.matchMedia('(pointer: fine)').matches && orb) {
      window.addEventListener(
        'pointermove',
        (event) => {
          const x = (event.clientX / window.innerWidth - 0.5) * 28;
          const y = (event.clientY / window.innerHeight - 0.5) * 20;
          orb.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        },
        { passive: true }
      );
    }

    document.querySelectorAll('.project-card').forEach((card) => {
      const node = card as HTMLElement;
      node.addEventListener('pointermove', (event) => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty('--mx', `${(event as PointerEvent).clientX - rect.left}px`);
        node.style.setProperty('--my', `${(event as PointerEvent).clientY - rect.top}px`);
      });
    });
  }
}