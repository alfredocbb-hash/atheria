import { Bell, Check, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMarkAllRead, useMarkNotificationRead, useMyNotifications } from "@/hooks/use-notifications";

export function NotificationsBell() {
  const { data = [], isLoading } = useMyNotifications();
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllRead();
  const unread = data.filter((n: any) => !n.read_at);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notificaciones</p>
          {unread.length > 0 && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              <Check className="mr-1 h-3 w-3" />Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : data.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">Sin notificaciones.</p>
          ) : (
            <ul className="divide-y">
              {data.map((n: any) => (
                <li key={n.id} className={!n.read_at ? "bg-accent/40" : ""}>
                  <div className="flex items-start gap-2 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{n.title}</p>
                        {!n.read_at && <Badge variant="default" className="h-4 px-1 text-[9px]">NUEVO</Badge>}
                      </div>
                      {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                        {n.link && (
                          <Link to={n.link} className="text-[10px] text-primary hover:underline" onClick={() => !n.read_at && markOne.mutate(n.id)}>
                            Abrir →
                          </Link>
                        )}
                      </div>
                    </div>
                    {!n.read_at && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => markOne.mutate(n.id)} title="Marcar leída">
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}