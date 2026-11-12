import './globals.css';

export const metadata = {
  title: "Suivi d'objectifs",
  description: 'Dashboard ventes et revenus partagé',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}