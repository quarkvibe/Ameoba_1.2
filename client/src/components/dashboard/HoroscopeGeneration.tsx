import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface HoroscopeData {
  sign: string;
  date: string;
  horoscope: {
    id: string;
    zodiacSignId: string;
    date: string;
    horoscope: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface GenerationStatus {
  isGenerating: boolean;
  lastGeneration?: string;
  totalSigns: number;
  completedSigns: number;
  failedSigns: number;
}

const zodiacSigns = [
  { id: 'aries', name: 'Aries', icon: '♈', color: 'bg-red-500' },
  { id: 'taurus', name: 'Taurus', icon: '♉', color: 'bg-green-500' },
  { id: 'gemini', name: 'Gemini', icon: '♊', color: 'bg-yellow-500' },
  { id: 'cancer', name: 'Cancer', icon: '♋', color: 'bg-blue-500' },
  { id: 'leo', name: 'Leo', icon: '♌', color: 'bg-orange-500' },
  { id: 'virgo', name: 'Virgo', icon: '♍', color: 'bg-green-600' },
  { id: 'libra', name: 'Libra', icon: '♎', color: 'bg-pink-500' },
  { id: 'scorpio', name: 'Scorpio', icon: '♏', color: 'bg-purple-500' },
  { id: 'sagittarius', name: 'Sagittarius', icon: '♐', color: 'bg-indigo-500' },
  { id: 'capricorn', name: 'Capricorn', icon: '♑', color: 'bg-gray-600' },
  { id: 'aquarius', name: 'Aquarius', icon: '♒', color: 'bg-cyan-500' },
  { id: 'pisces', name: 'Pisces', icon: '♓', color: 'bg-teal-500' },
];

export default function HoroscopeGeneration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get today's horoscopes to check status
  const { data: todayHoroscopes, isLoading: loadingHoroscopes } = useQuery({
    queryKey: ["/api/horoscopes/today"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Get queue metrics for generation status
  const { data: queueMetrics, isLoading: loadingQueue } = useQuery({
    queryKey: ["/api/queue/metrics"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const generateAllMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/cron/trigger-horoscopes", {
      date: new Date().toISOString().split('T')[0]
    }),
    onSuccess: () => {
      toast({
        title: "Generation Started",
        description: "Manual horoscope generation has been triggered for all 12 zodiac signs.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/horoscopes/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/queue/metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateSingleMutation = useMutation({
    mutationFn: (zodiacSign: string) => apiRequest("POST", "/api/cron/trigger-horoscopes", {
      date: new Date().toISOString().split('T')[0],
      zodiacSign: zodiacSign
    }),
    onSuccess: (_, zodiacSign) => {
      toast({
        title: "Generation Started",
        description: `Horoscope generation triggered for ${zodiacSign}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/horoscopes/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/queue/metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getSignStatus = (signId: string) => {
    const horoscopes = todayHoroscopes?.horoscopes || [];
    const hasHoroscope = horoscopes.some((h: any) => h.zodiacSignId === signId);
    return hasHoroscope ? 'completed' : 'pending';
  };

  const completedSigns = todayHoroscopes?.horoscopes?.length || 0;
  const totalSigns = 12;
  const completionPercentage = Math.round((completedSigns / totalSigns) * 100);

  if (loadingHoroscopes || loadingQueue) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Generation Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-star text-accent"></i>
              Horoscope Generation Control
            </CardTitle>
            <Badge variant={completedSigns === totalSigns ? "default" : "secondary"}>
              {completedSigns}/{totalSigns} Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          
          {/* Progress Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary" data-testid="text-completion-percentage">
                {completionPercentage}%
              </div>
              <div className="text-sm text-muted-foreground">Completion</div>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <div className="text-2xl font-bold text-accent" data-testid="text-completed-signs">
                {completedSigns}
              </div>
              <div className="text-sm text-muted-foreground">Signs Complete</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
              <div className="text-2xl font-bold text-yellow-500" data-testid="text-pending-signs">
                {totalSigns - completedSigns}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground" data-testid="text-queue-depth">
                {queueMetrics?.pending || 0}
              </div>
              <div className="text-sm text-muted-foreground">In Queue</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span>Generation Progress</span>
              <span>{completedSigns}/{totalSigns}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => generateAllMutation.mutate()}
              disabled={generateAllMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-generate-all"
            >
              <i className="fas fa-magic mr-2"></i>
              {generateAllMutation.isPending ? "Generating..." : "Generate All Signs"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/horoscopes/today"] });
                queryClient.invalidateQueries({ queryKey: ["/api/queue/metrics"] });
              }}
              data-testid="button-refresh"
            >
              <i className="fas fa-refresh mr-2"></i>
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Individual Zodiac Signs */}
      <Card>
        <CardHeader>
          <CardTitle>Zodiac Signs Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {zodiacSigns.map((sign) => {
              const status = getSignStatus(sign.id);
              const isGenerating = generateSingleMutation.isPending;
              
              return (
                <div
                  key={sign.id}
                  className={`relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    status === 'completed' 
                      ? 'bg-accent/10 border-accent' 
                      : 'bg-muted/50 border-muted hover:border-muted-foreground'
                  }`}
                  data-testid={`sign-${sign.id}`}
                >
                  <div className="text-center space-y-2">
                    <div className="text-2xl">{sign.icon}</div>
                    <div className="font-medium text-sm">{sign.name}</div>
                    <Badge 
                      variant={status === 'completed' ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {status === 'completed' ? '✓ Ready' : 'Pending'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateSingleMutation.mutate(sign.id)}
                      disabled={isGenerating || status === 'completed'}
                      className="w-full text-xs"
                      data-testid={`button-generate-${sign.id}`}
                    >
                      <i className="fas fa-magic mr-1"></i>
                      Generate
                    </Button>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                    status === 'completed' 
                      ? 'bg-accent animate-pulse' 
                      : 'bg-muted-foreground'
                  }`}></div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}