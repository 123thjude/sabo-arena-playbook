import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Tên giải đấu phải có ít nhất 2 ký tự.",
  }),
  start_date: z.date({
    required_error: "Vui lòng chọn ngày bắt đầu.",
  }),
  max_participants: z.string().transform((v) => parseInt(v, 10)).refine((v) => v > 0, {
    message: "Số lượng người tham gia phải lớn hơn 0.",
  }),
  game_format: z.string({
    required_error: "Vui lòng chọn thể thức thi đấu.",
  }),
  venue_address: z.string().min(5, {
    message: "Địa chỉ phải có ít nhất 5 ký tự.",
  }),
  entry_fee: z.string().transform((v) => parseInt(v, 10)).optional(),
  prize_pool: z.string().transform((v) => parseInt(v, 10)).optional(),
});

const CreateTournament = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      max_participants: 32,
      game_format: "single_elimination",
      venue_address: "",
      entry_fee: 0,
      prize_pool: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        title: "Lỗi",
        description: "Bạn cần đăng nhập để tạo giải đấu.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("tournaments")
        .insert({
          title: values.title,
          start_date: values.start_date.toISOString(),
          max_participants: values.max_participants,
          game_format: values.game_format,
          venue_address: values.venue_address,
          entry_fee: values.entry_fee || 0,
          prize_pool: values.prize_pool || 0,
          status: "upcoming",
          organizer_id: user.id, // Assuming there is an organizer_id field or similar
          current_participants: 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Giải đấu đã được tạo thành công.",
      });

      navigate(`/tournaments/${data.id}`);
    } catch (error: any) {
      console.error("Error creating tournament:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi tạo giải đấu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container max-w-3xl py-10 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Tạo Giải Đấu Mới</h1>
          <p className="text-muted-foreground">
            Điền thông tin chi tiết để tổ chức giải đấu của bạn.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên giải đấu</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: Giải Bida Mở Rộng Mùa Hè" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày bắt đầu</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Chọn ngày</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="game_format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thể thức thi đấu</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn thể thức" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single_elimination">Loại trực tiếp (Single Elimination)</SelectItem>
                        <SelectItem value="double_elimination">Nhánh thắng nhánh thua (Double Elimination)</SelectItem>
                        <SelectItem value="round_robin">Vòng tròn tính điểm (Round Robin)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="max_participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số người tham gia tối đa</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entry_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phí tham gia (VNĐ)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prize_pool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tổng giải thưởng (VNĐ)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="venue_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa điểm tổ chức</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: CLB Bida Sabo, 123 Đường ABC..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Đang tạo..." : "Tạo Giải Đấu"}
            </Button>
          </form>
        </Form>
      </div>
      <Footer />
    </div>
  );
};

export default CreateTournament;
