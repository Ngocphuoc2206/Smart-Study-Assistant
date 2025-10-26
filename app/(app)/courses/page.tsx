// app/(app)/courses/page.tsx
"use client";

import CourseGrid from "@/features/courses/CourseGrid";

export default function CoursesPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Môn học
      </h1>
      <CourseGrid />
    </div>
  );
}