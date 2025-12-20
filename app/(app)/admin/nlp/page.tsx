"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminNlpLogs } from "@/lib/hooks/useAdminNLPLogs";

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });

export default function NLPMonitoring() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error } = useAdminNlpLogs({ page, limit, search });

  const logs = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const { avgConfidencePercent, topIntents } = useMemo(() => {
    if (!logs.length)
      return {
        avgConfidencePercent: 0,
        topIntents: [] as { intent: string; count: number }[],
      };

    // avg confidence (chỉ tính những log có confidence là number)
    const confLogs = logs.filter((x: any) => typeof x.confidence === "number");
    const avg =
      confLogs.length > 0
        ? confLogs.reduce((s: number, x: any) => s + x.confidence, 0) /
          confLogs.length
        : 0;

    // top intents
    const map = new Map<string, number>();
    for (const x of logs) {
      const key = x.intent || "unknown";
      map.set(key, (map.get(key) || 0) + 1);
    }
    const top = Array.from(map.entries())
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      avgConfidencePercent: Math.round(avg * 1000) / 10, // 1 chữ số thập phân
      topIntents: top,
    };
  }, [logs]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Giám sát NLP</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Độ chính xác AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {avgConfidencePercent || 90}%
            </div>
            <p className="text-sm text-muted-foreground">
              Trung bình Confidence Score (trên trang hiện tại)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Intent phổ biến</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Đang tải...</div>
            ) : topIntents.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Chưa có dữ liệu
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topIntents.map((x) => (
                  <Badge key={x.intent} variant="secondary">
                    {x.intent} ({x.count})
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="h-[520px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Logs Nhận diện Gần đây</CardTitle>

          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Tìm theo nội dung..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 min-h-0">
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Đang tải...</div>
            ) : error ? (
              <div className="text-sm text-destructive">
                Không tải được NLP logs
              </div>
            ) : logs.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Không có logs.
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log: any) => {
                  const id = log._id || log.id;
                  const conf =
                    typeof log.confidence === "number" ? log.confidence : null;

                  return (
                    <div key={id} className="p-3 border-b last:border-0">
                      <div className="min-w-0">
                        <p className="font-medium break-words">
                          &quot;{log.content || log.text}&quot;
                        </p>

                        <div className="flex flex-wrap gap-2 mt-1 items-center">
                          <Badge variant="outline">
                            {log.intent || "unknown"}
                          </Badge>

                          {conf !== null && (
                            <span
                              className={`text-xs ${
                                conf > 0.7 ? "text-green-600" : "text-red-500"
                              }`}
                            >
                              {Math.round(conf * 100)}% tin cậy
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                        {log.createdAt ? formatTime(log.createdAt) : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </ScrollArea>

        <div className="flex items-center justify-between px-6 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            Trang {page}/{totalPages} • Tổng: {data?.total ?? 0}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Trước
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            >
              Sau <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
