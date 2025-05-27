import { Navbar } from "../components/Navbar";

export default function MainLayout({ children }:
    {children: React.ReactNode}) {
    return (
        <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="max-w-6xl mx-auto p-4">
          {children}
        </main>
      </div>
    );
  }