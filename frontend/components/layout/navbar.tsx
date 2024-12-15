import { ModeToggle } from "@/components/layout/mode-toggle"

export default function Navbar() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
