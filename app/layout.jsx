import './globals.css';

export const metadata = {
  title: 'استوری محصولات پویا و رومی پنل — بازرگانی قربانی',
  description: 'استوری‌های معرفی محصولات گروه صنعتی پویا و رومی پنل با اطلاعات کامل کاتالوگ — بازرگانی قربانی، تبریز',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
