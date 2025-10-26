// features/chat/NLPPreviewDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NLPResult } from "./mockNLP";
import { useCreateEventMutation } from "@/lib/hooks/useEventMutations";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface NLPPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: NLPResult | null;
}

export function NLPPreviewDialog({ isOpen, onClose, data }: NLPPreviewDialogProps) {
  const createEventMutation = useCreateEventMutation();
  
  if (!data) return null;
  const { entities, reminders } = data;
  
  const handleConfirm = () => {
    createEventMutation.mutate(
      { eventData: entities, reminders },
      { onSuccess: onClose } // Đóng dialog khi thành công
    );
  };

  const formattedDate = entities.date 
    ? format(new Date(`${entities.date}T00:00:00`), "EEEE, dd/MM/yyyy", { locale: vi })
    : "Chưa rõ";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận tạo sự kiện?</DialogTitle>
          <DialogDescription>
            Trợ lý đã trích xuất thông tin sau. Vui lòng xác nhận:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tiêu đề:</span>
            <span className="font-medium">{entities.title || "Chưa rõ"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Loại:</span>
            <Badge variant={entities.type === 'exam' ? 'destructive' : 'secondary'}>
              {entities.type}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ngày:</span>
            <span className="font-medium">{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Giờ:</span>
            <span className="font-medium">{entities.timeStart || "Chưa rõ"}</span>
          </div>
          {reminders && reminders.length > 0 && (
             <div className="flex justify-between">
              <span className="text-muted-foreground">Nhắc trước:</span>
              <span className="font-medium">{reminders.map(r => `${-r/3600} giờ`).join(', ')}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button 
            onClick={handleConfirm}
            disabled={createEventMutation.isPending}
          >
            {createEventMutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}