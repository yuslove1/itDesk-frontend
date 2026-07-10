import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Menu } from "lucide-react";

/** App topbar — deep red with green underline.
 *  Shows hamburger on mobile, logo + user info always. */
export function Topbar({ user, subtitle, actions, onMenuToggle }) {
  return (
    <header className="bg-uac-red-deep border-b-2 border-uac-green flex items-center px-3 md:px-4 gap-2 h-[52px] shrink-0">
      {/* Hamburger — only visible on mobile */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden text-white/70 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={17} strokeWidth={2} />
      </button>

      {/* Logo */}
      <div className="text-[14px] font-bold text-white tracking-wide flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-uac-green" />
        <span>IT Desk</span>
      </div>

      {/* Subtitle — hidden on very small screens */}
      {subtitle && (
        <>
          <div className="hidden sm:block w-px h-[18px] bg-white/10" />
          <span className="hidden sm:block text-[11px] text-white/40 truncate">
            {subtitle}
          </span>
        </>
      )}

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {actions}
        {user && <Badge role={user.role} />}
        <Avatar initials={user?.initials ?? "…"} role={user?.role ?? "staff"} size="md" />
      </div>
    </header>
  );
}
