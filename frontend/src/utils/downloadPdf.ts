/**
 * Load jsPDF from CDN at runtime. Use this instead of importing jspdf
 * so the app builds in environments where the jspdf package is not installed (e.g. Docker).
 */
declare global {
  interface Window {
    jspdf?: { jsPDF: JsPDFConstructor };
  }
}

export type JsPDFConstructor = new (opts?: { format?: string; unit?: string }) => JsPDFDoc;

export interface JsPDFDoc {
  setFontSize(size: number): void;
  setTextColor(r: number, g: number, b: number): void;
  text(text: string | string[], x: number, y: number): void;
  splitTextToSize(text: string, maxWidth: number): string[];
  addPage(): void;
  save(filename: string): void;
}

const CDN_URL =
  import.meta.env.VITE_JSPDF_CDN_URL ||
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

export function loadJsPDF(): Promise<JsPDFConstructor> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Not in browser'));
  }
  if (window.jspdf?.jsPDF) {
    return Promise.resolve(window.jspdf.jsPDF);
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CDN_URL;
    script.async = true;
    script.onload = () => {
      if (window.jspdf?.jsPDF) {
        resolve(window.jspdf.jsPDF);
      } else {
        reject(new Error('jsPDF failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load jsPDF script'));
    document.head.appendChild(script);
  });
}
