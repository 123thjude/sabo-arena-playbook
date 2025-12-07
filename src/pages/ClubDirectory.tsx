import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useClubs } from "@/hooks/useClubs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  MapPin, 
  Phone, 
  Star, 
  Users, 
  Trophy, 
  Award,
  Building,
  Filter,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead, { SEO_PAGES } from "@/components/SEOHead";

const ClubDirectory = () => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [currentPage, setCurrentPage] = useState(1);
  const clubsPerPage = 12;

  const { data: clubs, isLoading: clubsLoading } = useClubs();

  // Filter and search clubs
  const filteredClubs = clubs?.filter((club) => {
    const nameMatch = searchQuery === "" || 
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const locationMatch = locationFilter === "all" || 
      club.address?.toLowerCase().includes(locationFilter.toLowerCase());
    
    return nameMatch && locationMatch;
  }) || [];

  // Sort clubs
  const sortedClubs = [...filteredClubs].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "tournaments":
        return (b.tournaments_hosted || 0) - (a.tournaments_hosted || 0);
      case "tables":
        return (b.total_tables || 0) - (a.total_tables || 0);
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return (b.rating || 0) - (a.rating || 0);
    }
  });

  // Pagination
  const startIndex = (currentPage - 1) * clubsPerPage;
  const endIndex = startIndex + clubsPerPage;
  const paginatedClubs = sortedClubs.slice(startIndex, endIndex);
  const totalPages = Math.ceil(sortedClubs.length / clubsPerPage);

  // Get unique locations for filter
  const uniqueLocations = clubs ? [...new Set(clubs.map(club => 
    club.address?.split(",").pop()?.trim()
  ).filter(Boolean))] : [];

  const getRatingColor = (rating: number | null) => {
    if (!rating) return "text-slate-400";
    if (rating >= 4.5) return "text-green-400";
    if (rating >= 4) return "text-yellow-400";
    if (rating >= 3) return "text-orange-400";
    return "text-red-400";
  };

  const getRatingStars = (rating: number | null) => {
    if (!rating) return "No rating";
    return "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
  };

  if (clubsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-24">
          <Skeleton className="h-12 w-64 mb-8 mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((id) => (
              <Skeleton key={`club-skeleton-${id}`} className="h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={language === 'vi' ? SEO_PAGES.clubs.title : 'Vietnam Billiards Clubs Directory - Find Clubs Near You'}
        description={language === 'vi' ? SEO_PAGES.clubs.description : 'Find billiards clubs near you on SABO ARENA. Reviews, addresses, table count, prices. Over 500 clubs nationwide!'}
        canonical={SEO_PAGES.clubs.canonical}
        keywords={SEO_PAGES.clubs.keywords}
      />
      {/* Hero Section */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-4 py-2 rounded-full text-sm font-bold tracking-wider uppercase mb-6">
              <Building className="w-4 h-4" />
              {t("nav.clubs")}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {t("clubs.directory")} <span className="text-gold">{t("clubs.venues")}</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
              {t("clubs.description")}
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="p-6 bg-slate-800/50 border-slate-700">
                <Building className="w-8 h-8 text-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{clubs?.length || 0}</p>
                <p className="text-slate-400 text-sm">{t("clubs.totalClubs")}</p>
              </Card>
              <Card className="p-6 bg-slate-800/50 border-slate-700">
                <Trophy className="w-8 h-8 text-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {clubs?.reduce((sum, c) => sum + (c.tournaments_hosted || 0), 0) || 0}
                </p>
                <p className="text-slate-400 text-sm">{t("clubs.totalTournaments")}</p>
              </Card>
              <Card className="p-6 bg-slate-800/50 border-slate-700">
                <Users className="w-8 h-8 text-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {clubs?.reduce((sum, c) => sum + (c.total_tables || 0), 0) || 0}
                </p>
                <p className="text-slate-400 text-sm">{t("clubs.totalTables")}</p>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row gap-4 items-center justify-between"
          >
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("clubs.searchClubs")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
              {/* Location Filter */}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-40 bg-slate-700 border-slate-600">
                    <SelectValue placeholder={t("clubs.allLocations")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("clubs.allLocations")}</SelectItem>
                    {uniqueLocations.map((location) => (
                      <SelectItem key={String(location)} value={String(location)}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">{t("clubs.sortByRating")}</SelectItem>
                    <SelectItem value="tournaments">{t("clubs.sortByTournaments")}</SelectItem>
                    <SelectItem value="tables">{t("clubs.sortByTables")}</SelectItem>
                    <SelectItem value="name">{t("clubs.sortByName")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Clubs Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {paginatedClubs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{t("clubs.noClubsFound")}</h3>
              <p className="text-muted-foreground">{t("clubs.tryDifferentFilters")}</p>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {paginatedClubs.map((club, index) => (
                  <motion.div
                    key={club.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                  >
                    <Card className="group overflow-hidden border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-gold/30 transition-all duration-300 cursor-pointer h-full">
                      {/* Club Image/Logo */}
                      <div className="relative">
                        {club.cover_image_url ? (
                          <img
                            src={club.cover_image_url}
                            alt={club.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-gold/20 to-gold/40 flex items-center justify-center">
                            <Building className="w-16 h-16 text-gold/70" />
                          </div>
                        )}
                        
                        {/* Rating Badge */}
                        {Boolean(club.rating) && (
                          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
                            <div className="flex items-center gap-1">
                              <Star className={`w-4 h-4 ${getRatingColor(club.rating)}`} />
                              <span className="text-white text-sm font-bold">{club.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        )}

                        {/* Logo Overlay */}
                        {club.logo_url && (
                          <div className="absolute bottom-4 left-4">
                            <img
                              src={club.logo_url}
                              alt={`${club.name} logo`}
                              className="w-12 h-12 rounded-lg border-2 border-white shadow-lg object-cover"
                            />
                          </div>
                        )}
                      </div>

                      {/* Club Info */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gold transition-colors line-clamp-1">
                          {club.name}
                        </h3>

                        {/* Address */}
                        <div className="flex items-start gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                          <p className="text-sm text-slate-400 line-clamp-2">{club.address}</p>
                        </div>

                        {/* Rating Stars */}
                        {Boolean(club.rating) && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`text-lg ${getRatingColor(club.rating)}`}>
                              {getRatingStars(club.rating)}
                            </div>
                            <span className="text-sm text-slate-400">({club.rating.toFixed(1)})</span>
                          </div>
                        )}

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-gold">{club.total_tables || 0}</p>
                            <p className="text-xs text-slate-400">{t("clubs.tables")}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-gold">{club.tournaments_hosted || 0}</p>
                            <p className="text-xs text-slate-400">{t("clubs.tournaments")}</p>
                          </div>
                        </div>

                        {/* Contact Info */}
                        {club.phone && (
                          <div className="flex items-center gap-2 mb-4">
                            <Phone className="w-4 h-4 text-gold" />
                            <span className="text-sm text-slate-300">{club.phone}</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <Button 
                            asChild
                            variant="outline" 
                            size="sm" 
                            className="w-full border-gold/30 text-gold hover:bg-gold hover:text-black transition-all"
                          >
                            <Link to={`/clubs/${club.id}`}>
                              {t("clubs.viewDetails")}
                            </Link>
                          </Button>
                          {club.phone && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full text-slate-400 hover:text-white"
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              {t("clubs.contact")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex justify-center items-center gap-2 mt-12"
                >
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="border-slate-600"
                  >
                    {t("common.previous")}
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pageNumber = Math.max(1, currentPage - 2) + i;
                    if (pageNumber > totalPages) return null;

                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={currentPage === pageNumber 
                          ? "bg-gold text-black hover:bg-gold/90" 
                          : "border-slate-600"
                        }
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="border-slate-600"
                  >
                    {t("common.next")}
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Featured Clubs Section */}
      <section className="py-16 bg-slate-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t("clubs.featuredClubs")}
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              {t("clubs.featuredDescription")}
            </p>
          </motion.div>

          {/* Featured clubs grid - showing top rated clubs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clubs?.filter(club => Boolean(club.rating) && club.rating >= 4.5)
              .slice(0, 3)
              .map((club, index) => (
                <motion.div
                  key={`featured-${club.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="group overflow-hidden border-gold/30 bg-slate-800/50 hover:bg-slate-800 hover:border-gold/50 transition-all duration-300">
                    <div className="relative">
                      {club.cover_image_url ? (
                        <img
                          src={club.cover_image_url}
                          alt={club.name}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-br from-gold/30 to-gold/50 flex items-center justify-center">
                          <Award className="w-8 h-8 text-gold" />
                        </div>
                      )}
                      
                      {/* Featured Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-gold text-black font-bold">
                          {t("clubs.featured")}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-bold text-white mb-2">{club.name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-gold" />
                        <span className="text-gold font-bold">{club.rating?.toFixed(1)}</span>
                        <span className="text-slate-400 text-sm">({t("clubs.topRated")})</span>
                      </div>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{club.address}</p>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex gap-4 text-sm">
                          <span className="text-slate-400">{club.total_tables} {t("clubs.tables")}</span>
                          <span className="text-slate-400">{club.tournaments_hosted} {t("clubs.events")}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-gold hover:text-black hover:bg-gold">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            }
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClubDirectory;