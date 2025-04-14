interface NavItem {
  label: string;
  section: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Objective", section: "objective" },
  { label: "Research", section: "research" },
  { label: "Deliverables", section: "deliverables" },
  { label: "Chat", section: "chat" },
];

export function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <div className="text-xl font-semibold">Stoller</div>
        <div className="space-x-6">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.section}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
} 