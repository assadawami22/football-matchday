import './globals.css';
import { Cairo } from 'next/font/google';

const display = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['700', '800'],
  variable: '--font-display',
});

const body = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export const metadata = {
  title: 'تمرين أنصاريان',
  description: 'التسجيل الأسبوعي للمباراة، الدفع، وقائمة اللاعبين.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${display.variable} ${body.variable}`}>
      <body className="bg-pitchDeep text-chalk font-body min-h-screen">
        {children}
      </body>
    </html>
  );
}
