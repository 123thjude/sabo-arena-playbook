import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  rank: z.string({
    required_error: "Vui lòng chọn hạng mong muốn.",
  }),
  phone: z.string().min(10, {
    message: "Số điện thoại phải có ít nhất 10 số.",
  }),
  notes: z.string().optional(),
});

interface RankRegistrationModalProps {
  clubId: string;
  clubName: string;
  trigger?: React.ReactNode;
}

export function RankRegistrationModal({ clubId, clubName, trigger }: RankRegistrationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Bạn cần đăng nhập để thực hiện chức năng này.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Insert request into club_rank_requests table
      // Note: This table needs to exist in Supabase
      const { error } = await supabase
        .from("club_rank_requests")
        .insert({
          user_id: user.id,
          club_id: clubId,
          requested_rank: values.rank,
          phone_number: values.phone,
          notes: values.notes,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Gửi yêu cầu thành công",
        description: `Yêu cầu đăng ký hạng tại ${clubName} đã được gửi.`,
      });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Error submitting rank request:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi gửi yêu cầu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Đăng ký hạng</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Đăng ký hạng tại {clubName}</DialogTitle>
          <DialogDescription>
            Gửi yêu cầu xác thực hạng của bạn tới chủ câu lạc bộ.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hạng mong muốn</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn hạng" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="K">Hạng K (Người mới)</SelectItem>
                      <SelectItem value="K+">Hạng K+ (Học việc)</SelectItem>
                      <SelectItem value="I">Hạng I (Thợ 3)</SelectItem>
                      <SelectItem value="I+">Hạng I+ (Thợ 2)</SelectItem>
                      <SelectItem value="H">Hạng H (Thợ 1)</SelectItem>
                      <SelectItem value="H+">Hạng H+ (Thợ chính)</SelectItem>
                      <SelectItem value="G">Hạng G (Thợ giỏi)</SelectItem>
                      <SelectItem value="G+">Hạng G+ (Thợ cả)</SelectItem>
                      <SelectItem value="F">Hạng F (Chuyên gia)</SelectItem>
                      <SelectItem value="E">Hạng E (Cao thủ)</SelectItem>
                      <SelectItem value="D">Hạng D (Huyền Thoại)</SelectItem>
                      <SelectItem value="C">Hạng C (Vô địch)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại liên hệ</FormLabel>
                  <FormControl>
                    <Input placeholder="0912345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú (Tùy chọn)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ví dụ: Tôi thường chơi vào buổi tối..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gửi yêu cầu
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
