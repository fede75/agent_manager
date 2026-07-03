import "./globals.css";

export const metadata = {
  title: "ADA AI Agents Authorization Console",
  description: "Governance mock for AI Agents, MCPs and subscriptions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
