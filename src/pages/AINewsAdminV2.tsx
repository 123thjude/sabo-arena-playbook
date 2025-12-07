import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import Navigation from "@/components/Navigation";
import GoogleDriveImageUploader from "@/components/GoogleDriveImageUploader";
import { useNewsManagement, NewsArticle } from "@/hooks/useNewsManagement";
import { useNewsStats } from "@/hooks/useNewsStats";
import { useAISettings } from "@/hooks/useAISettings";
import {
  Sparkles,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Settings as SettingsIcon,
  FileText,
  BarChart3,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";

const AINewsAdminV2 = () => {
  // Hooks
  const { news, loading: newsLoading, fetchNews, updateNews, deleteNews } = useNewsManagement();
  const { stats, loading: statsLoading } = useNewsStats();
  const { settings, saveSettings, getCostPerArticle } = useAISettings();
  
  // Force table re-render counter
  const [tableKey, setTableKey] = useState(0);
  
  // Edit dialog state
  const [editDialog, setEditDialog] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'published' as 'published' | 'draft' | 'archived'
  });
  
  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Settings form
  const [settingsForm, setSettingsForm] = useState(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [operationResult, setOperationResult] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Load news on mount
  useEffect(() => {
    const loadNews = async () => {
      await fetchNews();
    };
    loadNews();
  }, []);
  
  // Debug: Log when news changes
  useEffect(() => {
    console.log('📰 News state changed, count:', news.length);
    console.log('   Articles:', news.map(n => ({ id: n.id, title: n.title.substring(0, 30) })));
  }, [news]);
  
  // Update settings form when settings change
  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // Handle edit click
  const handleEdit = (article: NewsArticle) => {
    setEditingNews(article);
    setEditForm({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      status: article.status
    });
    setEditDialog(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingNews) return;
    
    const result = await updateNews(editingNews.id, editForm);
    
    if (result.success) {
      setOperationResult({
        type: 'success',
        message: '✅ Đã cập nhật bài viết thành công!'
      });
      setEditDialog(false);
      setEditingNews(null);
      
      // Clear message after 3s
      setTimeout(() => setOperationResult(null), 3000);
    } else {
      setOperationResult({
        type: 'error',
        message: `❌ Lỗi cập nhật: ${result.error}`
      });
    }
  };

  // Handle delete click
  const handleDeleteClick = (id: string) => {
    console.log('🗑️ Delete button clicked for ID:', id);
    setDeletingId(id);
    setDeleteDialog(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    
    console.log('🚀 Starting delete process for ID:', deletingId);
    setDeleting(true);
    const result = await deleteNews(deletingId);
    console.log('📋 Delete result:', result);
    
    if (result.success) {
      console.log('✅ Delete successful, forcing table re-render');
      // Force table re-render
      setTableKey(prev => prev + 1);
      
      setOperationResult({
        type: 'success',
        message: '✅ Đã xóa bài viết thành công!'
      });
      setDeleteDialog(false);
      setDeletingId(null);
      
      // Clear message after 3s
      setTimeout(() => setOperationResult(null), 3000);
    } else {
      console.error('❌ Delete failed:', result.error);
      setOperationResult({
        type: 'error',
        message: `❌ Lỗi: ${result.error}`
      });
    }
    
    setDeleting(false);
  };

  // Handle save settings
  const handleSaveSettings = () => {
    saveSettings(settingsForm);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-10 h-10 text-gold" />
                <h1 className="text-4xl font-bold text-white">
                  AI News Admin Panel
                </h1>
              </div>
              <p className="text-slate-400 text-lg">
                Quản lý tin tức AI • Thống kê • Cài đặt
              </p>
            </div>

            {/* Operation Result Alert */}
            {operationResult && (
              <Alert className={operationResult.type === 'success' ? 'border-green-500/50 bg-green-500/10 mb-6' : 'border-red-500/50 bg-red-500/10 mb-6'}>
                {operationResult.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <AlertDescription className="text-white">
                  {operationResult.message}
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="manage" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800">
                <TabsTrigger value="manage" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Quản Lý Bài Viết
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Upload Ảnh
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Thống Kê
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4" />
                  Cài Đặt AI
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: QUẢN LÝ BÀI VIẾT */}
              <TabsContent value="manage" className="space-y-6">
                <Card className="border-gold/20 bg-background/95">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-white">
                      <span className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gold" />
                        Danh Sách Bài Viết AI
                      </span>
                      <Badge variant="outline" className="text-gold border-gold">
                        {news.length} bài
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {newsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-gold" />
                      </div>
                    ) : news.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        Chưa có bài viết nào
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table key={tableKey}>
                          <TableHeader>
                            <TableRow className="border-slate-700">
                              <TableHead className="text-slate-300">Tiêu đề</TableHead>
                              <TableHead className="text-slate-300">Trạng thái</TableHead>
                              <TableHead className="text-slate-300">Ngày tạo</TableHead>
                              <TableHead className="text-slate-300">Model</TableHead>
                              <TableHead className="text-slate-300 text-right">Thao tác</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {news.map((article) => (
                              <TableRow key={article.id} className="border-slate-700 hover:bg-slate-800/50">
                                <TableCell className="text-white font-medium max-w-md truncate">
                                  {article.title}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={article.status === 'published' ? 'default' : 'secondary'}
                                    className={article.status === 'published' ? 'bg-green-600' : ''}
                                  >
                                    {article.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm">
                                  {formatDate(article.created_at)}
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm">
                                  {article.ai_model || 'gpt-4o-mini'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                      onClick={() => window.open(`/news/${article.slug}`, '_blank')}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                      onClick={() => handleEdit(article)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                      onClick={() => handleDeleteClick(article.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: UPLOAD ẢNH - Google Drive */}
              <TabsContent value="upload" className="space-y-6">
                <GoogleDriveImageUploader />
              </TabsContent>

              {/* TAB 3: THỐNG KÊ */}
              <TabsContent value="stats" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-blue-500/20 bg-background/95">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Tổng bài viết</p>
                          <p className="text-3xl font-bold text-blue-400">{stats.totalNews}</p>
                        </div>
                        <FileText className="w-10 h-10 text-blue-400/50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-500/20 bg-background/95">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Hôm nay</p>
                          <p className="text-3xl font-bold text-green-400">{stats.todayNews}</p>
                        </div>
                        <CheckCircle2 className="w-10 h-10 text-green-400/50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-500/20 bg-background/95">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Tuần này</p>
                          <p className="text-3xl font-bold text-purple-400">{stats.weekNews}</p>
                        </div>
                        <BarChart3 className="w-10 h-10 text-purple-400/50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gold/20 bg-background/95">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Chi phí ước tính</p>
                          <p className="text-3xl font-bold text-gold">${stats.estimatedCost}</p>
                        </div>
                        <DollarSign className="w-10 h-10 text-gold/50" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-gold/20 bg-background/95">
                  <CardHeader>
                    <CardTitle className="text-white">Chi Tiết Thống Kê</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-gold" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-800/50 rounded-lg">
                            <p className="text-sm text-slate-400 mb-1">Tháng này</p>
                            <p className="text-2xl font-bold text-white">{stats.monthNews} bài</p>
                          </div>
                          <div className="p-4 bg-slate-800/50 rounded-lg">
                            <p className="text-sm text-slate-400 mb-1">Published</p>
                            <p className="text-2xl font-bold text-green-400">{stats.publishedNews} bài</p>
                          </div>
                          <div className="p-4 bg-slate-800/50 rounded-lg">
                            <p className="text-sm text-slate-400 mb-1">Draft</p>
                            <p className="text-2xl font-bold text-yellow-400">{stats.draftNews} bài</p>
                          </div>
                          <div className="p-4 bg-slate-800/50 rounded-lg">
                            <p className="text-sm text-slate-400 mb-1">Avg Tokens/Bài</p>
                            <p className="text-2xl font-bold text-blue-400">{stats.avgTokensPerArticle}</p>
                          </div>
                        </div>

                        <Alert className="border-blue-500/50 bg-blue-500/10">
                          <AlertCircle className="h-5 w-5 text-blue-500" />
                          <AlertDescription className="text-white">
                            <strong>💡 Ghi chú:</strong> Chi phí được tính dựa trên GPT-4o-mini 
                            ($0.15/$0.60 per 1M tokens). Với model khác, chi phí sẽ khác.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3: CÀI ĐẶT AI */}
              <TabsContent value="settings" className="space-y-6">
                <Card className="border-gold/20 bg-background/95">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <SettingsIcon className="w-5 h-5 text-gold" />
                      Cấu Hình AI Model
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Model Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="model" className="text-white">AI Model</Label>
                      <Select 
                        value={settingsForm.model}
                        onValueChange={(value: any) => setSettingsForm({...settingsForm, model: value})}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="gpt-4o-mini" className="text-white">
                            GPT-4o Mini (Rẻ nhất - $0.15/$0.60)
                          </SelectItem>
                          <SelectItem value="gpt-4-turbo" className="text-white">
                            GPT-4 Turbo (Mạnh nhất - $10/$30)
                          </SelectItem>
                          <SelectItem value="gpt-3.5-turbo" className="text-white">
                            GPT-3.5 Turbo (Cân bằng - $0.50/$1.50)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-slate-400">
                        Chi phí/bài: <span className="text-gold font-semibold">${getCostPerArticle()}</span>
                      </p>
                    </div>

                    {/* Temperature */}
                    <div className="space-y-2">
                      <Label htmlFor="temperature" className="text-white">
                        Temperature: {settingsForm.temperature}
                      </Label>
                      <Slider
                        value={[settingsForm.temperature]}
                        onValueChange={(value) => setSettingsForm({...settingsForm, temperature: value[0]})}
                        min={0}
                        max={2}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-sm text-slate-400">
                        0 = Nhất quán, 1 = Cân bằng, 2 = Sáng tạo
                      </p>
                    </div>

                    {/* Max Tokens */}
                    <div className="space-y-2">
                      <Label htmlFor="maxTokens" className="text-white">
                        Max Tokens: {settingsForm.maxTokens}
                      </Label>
                      <Slider
                        value={[settingsForm.maxTokens]}
                        onValueChange={(value) => setSettingsForm({...settingsForm, maxTokens: value[0]})}
                        min={500}
                        max={4000}
                        step={100}
                        className="w-full"
                      />
                      <p className="text-sm text-slate-400">
                        Độ dài tối đa của bài viết (1 token ≈ 0.75 từ tiếng Anh)
                      </p>
                    </div>

                    {/* Default Persona */}
                    <div className="space-y-2">
                      <Label htmlFor="persona" className="text-white">Persona Mặc Định</Label>
                      <Select 
                        value={settingsForm.defaultPersona}
                        onValueChange={(value: any) => setSettingsForm({...settingsForm, defaultPersona: value})}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="random" className="text-white">🎲 Random (Ngẫu nhiên)</SelectItem>
                          <SelectItem value="chi-huong" className="text-white">👩‍💼 Chị Hương (Quản lý)</SelectItem>
                          <SelectItem value="anh-tuan" className="text-white">🎯 Anh Tuấn (Chuyên gia)</SelectItem>
                          <SelectItem value="mc-minh-anh" className="text-white">🎤 MC Minh Anh</SelectItem>
                          <SelectItem value="em-linh" className="text-white">📝 Em Linh (Reporter)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Daily Limit */}
                    <div className="space-y-2">
                      <Label htmlFor="dailyLimit" className="text-white">
                        Giới Hạn Bài/Ngày: {settingsForm.dailyLimit}
                      </Label>
                      <Slider
                        value={[settingsForm.dailyLimit]}
                        onValueChange={(value) => setSettingsForm({...settingsForm, dailyLimit: value[0]})}
                        min={1}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Auto Generation */}
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                      <div>
                        <Label htmlFor="autoGen" className="text-white">Tự Động Tạo Tin</Label>
                        <p className="text-sm text-slate-400">Chạy tự động mỗi ngày lúc 6:00 AM</p>
                      </div>
                      <Switch
                        id="autoGen"
                        checked={settingsForm.autoGeneration}
                        onCheckedChange={(checked) => setSettingsForm({...settingsForm, autoGeneration: checked})}
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex gap-4">
                      <Button
                        onClick={handleSaveSettings}
                        className="flex-1 bg-gold text-black hover:bg-gold/90"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Lưu Cài Đặt
                      </Button>
                      
                      {saveSuccess && (
                        <Alert className="flex-1 border-green-500/50 bg-green-500/10">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <AlertDescription className="text-white">
                            Đã lưu thành công!
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Bài Viết</DialogTitle>
            <DialogDescription className="text-slate-400">
              Sửa thông tin bài viết AI đã tạo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                className="bg-slate-900 border-slate-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Trích đoạn</Label>
              <Textarea
                value={editForm.excerpt}
                onChange={(e) => setEditForm({...editForm, excerpt: e.target.value})}
                className="bg-slate-900 border-slate-700 h-20"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Nội dung</Label>
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                className="bg-slate-900 border-slate-700 h-64 font-mono text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select 
                value={editForm.status}
                onValueChange={(value: any) => setEditForm({...editForm, status: value})}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Hủy
            </Button>
            <Button onClick={handleSaveEdit} className="bg-gold text-black hover:bg-gold/90">
              <Save className="w-4 h-4 mr-2" />
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              Xác Nhận Xóa
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setDeleteDialog(false)}
              disabled={deleting}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AINewsAdminV2;
