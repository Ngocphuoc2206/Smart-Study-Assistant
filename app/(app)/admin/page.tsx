"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStats } from "@/lib/hooks/useAdminStats";
import { useAdminAnalytics } from "@/lib/hooks/useAdminAnalytics";
import { Users, BookOpen, MessageSquare, Activity } from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function AdminDashboard() {
  const { data, isLoading, error } = useAdminStats();
  const [days, setDays] = useState(7);
  const { data: analytics, isLoading: aLoading } = useAdminAnalytics(days);

  const stats = [
    {
      title: "Người dùng",
      value: data?.users ?? 0,
      desc: "Tổng số người dùng",
      icon: Users,
    },
    {
      title: "Khóa học",
      value: data?.courses ?? 0,
      desc: "Tổng số khóa học",
      icon: BookOpen,
    },
    {
      title: "Tin nhắn",
      value: data?.messages ?? 0,
      desc: "Tổng số chat message",
      icon: MessageSquare,
    },
    {
      title: "Hoạt động",
      value: (data?.tasks || 0) + (data?.schedules || 0),
      desc: "Tổng số sự kiện",
      icon: Activity,
    },
  ];

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Không tải được thống kê</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Tổng quan Hệ thống</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <button
          className={`px-3 py-1 rounded ${
            days === 7 ? "bg-primary text-white" : "bg-muted"
          }`}
          onClick={() => setDays(7)}
        >
          7 ngày
        </button>
        <button
          className={`px-3 py-1 rounded ${
            days === 30 ? "bg-primary text-white" : "bg-muted"
          }`}
          onClick={() => setDays(30)}
        >
          30 ngày
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Hoạt động gần đây (tin nhắn/ngày)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {aLoading || !analytics ? (
              <div className="text-sm text-muted-foreground">Đang tải...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.activity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="messages" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Phân phối Intent</CardTitle>
          </CardHeader>
          <CardContent>
            {aLoading || !analytics ? (
              <div className="text-sm text-muted-foreground">Đang tải...</div>
            ) : analytics.intents.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Chưa có dữ liệu intent
              </div>
            ) : (
              <div className="space-y-2">
                {analytics.intents.slice(0, 6).map((x) => (
                  <div key={x.intent} className="flex justify-between text-sm">
                    <span className="truncate max-w-[65%]">{x.intent}</span>
                    <span className="font-bold">{x.percent}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
