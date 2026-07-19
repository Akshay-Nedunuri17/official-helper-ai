import { useEffect, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data ?? []) as Notification[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { setItems([]); return; }
    load();
    const channel = supabase
      .channel(`notifs:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    load();
  };

  const markOneRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="notifications" className="relative">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold grid place-items-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 gap-1 text-xs">
              <Check className="size-3" /> Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {loading && items.length === 0 ? (
          <div className="py-6 grid place-items-center"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">You're all caught up.</div>
        ) : (
          items.map((n) => {
            const inner = (
              <div className={`px-3 py-2.5 border-b border-border last:border-b-0 ${!n.read ? "bg-primary/5" : ""}`}>
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 size-2 rounded-full bg-primary shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{n.title}</div>
                    {n.message && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</div>}
                    <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} to={n.link as any} onClick={() => markOneRead(n.id)} className="block hover:bg-secondary/50 transition-colors">
                {inner}
              </Link>
            ) : (
              <button key={n.id} onClick={() => markOneRead(n.id)} className="w-full text-left hover:bg-secondary/50 transition-colors">
                {inner}
              </button>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
