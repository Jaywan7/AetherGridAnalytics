

export interface Draw {
    drawDate: string;
    mainNumbers: number[];
    starNumbers: number[];
}

export interface PatternInsight {
    title: string;
    detail: string;
    deviation: number;
}

export interface AetherScoreBreakdown {
    frequency: number;
    zone: number;
    dormancy: number;
    companion: number;
    seasonal?: number;
    postDormancy?: number;
    momentum?: number;
    clusterStrength?: number;
    stability?: number;
}

export interface AetherScoreResult {
    rank: number;
    number: number;
    score: number;
    breakdown: AetherScoreBreakdown;
    justification: string;
}

export interface AetherStarScoreResult {
    rank: number;
    number: number;
    score: number;
    breakdown: {
        frequency: number;
        dormancy: number;
    };
    justification: string;
}

export interface AetherScoreData {
    mainNumberScores: AetherScoreResult[];
    starNumberScores: AetherStarScoreResult[];
    insight?: string;
}

export interface IntelligentCoupon {
    rank: number;
    mainNumbers: number[];
    starNumbers: number[];
    score: number;
    justification: string;
}

export interface SeasonalPeriodData {
    [period: string]: { number: number; count: number }[];
}

export interface SeasonalAnalysis {
    monthly: SeasonalPeriodData;
    quarterly: SeasonalPeriodData;
}

export interface WeightConfiguration {
    frequency: number;
    dormancy: number;
    zone: number;
    companion: number;
    seasonal: number;
    momentum: number;
    clusterStrength: number;
    stability: number;
}

export interface HotColdTransition {
    number: number;
    transitions: number;
    currentState: 'Hot' | 'Cold' | 'Neutral';
}

export interface DormancyBreakdownSignal {
    signal: string;
    occurrenceRate: number;
    description: string;
}

export interface CorrelationInsight {
    title: string;
    description: string;
    strength: 'Weak' | 'Moderate' | 'Strong';
}

export interface MetaPatternAnalysis {
    hotColdTransitions: HotColdTransition[];
    dormancyBreakSignals: DormancyBreakdownSignal[];
    correlationInsights: CorrelationInsight[];
}

export interface AnalysisResult {
    totalRows: number;
    validDraws: number;
    topPatterns: PatternInsight[];
    patternAnalysis: PatternAnalysis;
    mainNumberFrequencies: FrequencyData[];
    starNumberFrequencies: FrequencyData[];
    strategies: StrategyResult[];
    aetherScores?: AetherScoreData;
    intelligentCoupons?: IntelligentCoupon[];
    seasonalAnalysis?: SeasonalAnalysis;
    optimalWeights?: WeightConfiguration;
    regimeShiftDetected?: boolean;
    metaPatternAnalysis?: MetaPatternAnalysis;
}

// FIX: Add missing type definitions to resolve import errors in components.
export interface FrequencyData {
    number: number | string;
    count: number; // Renamed from observed for clarity
    expected?: number;
    observed?: number; // Keep for chart compatibility
}

export interface CategoryData {
    name: string;
    observed: number;
    theoretical: number;
    totalDraws?: number;
}

export interface SumData {
    sumRange: string;
    count: number;
}

export interface StrategyCoupon {
    rank: number;
    mainNumbers: number[];
    starNumbers: number[];
    insight: string;
}

export interface StrategyResult {
    title: string;
    description: string;
    coupons: StrategyCoupon[];
}

export interface Companion {
    number: number;
    count: number;
}

export interface CompanionAnalysis {
    companionData: {
        [key: number]: Companion[];
    };
}

export interface StarEvenOddData {
    combination: string;
    percentage: number;
    theoretical: number;
}

export interface DormancyData {
    number: number;
    currentDormancy: number;
    averageDormancy: number;
    isOverdue: boolean;
}

export interface SimpleBarChartData {
    name: string | number;
    value: number;
}

interface ZoneAnalysis {
    zoneDistribution: SimpleBarChartData[];
    hotZone: string;
    coldZone: string;
    concentrationStats: {
        threeOrMoreInZone: {
            percentage: number;
        };
    };
}

interface SpreadAnalysis {
    spreadDistribution: SimpleBarChartData[];
    averageSpread: number;
    mostCommonSpread: string;
}

interface StarSumAnalysis {
    sumDistribution: SimpleBarChartData[];
    mostCommonSum: string;
}

interface StarEvenOddAnalysis {
    evenOddDistribution: StarEvenOddData[];
}

interface RepetitionAnalysis {
    mainRepeatRate: number;
    doubleMainRepeatRate: number;

    starRepeatRate: number;
}

interface DormancyAnalysis {
    mainNumberDormancy: DormancyData[];
    starNumberDormancy: DormancyData[];
}

export interface DeltaAnalysisResult {
    averageDelta: number;
    deltaDistribution: SimpleBarChartData[];
}

export interface MomentumData {
    number: number;
    momentumScore: number;
}

export interface ClusterStrengthData {
    number: number;
    clusterScore: number;
}

export interface PatternAnalysis {
    zoneAnalysis: ZoneAnalysis;
    spreadAnalysis: SpreadAnalysis;
    companionAnalysis: CompanionAnalysis;
    starSumAnalysis: StarSumAnalysis;
    starEvenOddAnalysis: StarEvenOddAnalysis;
    repetitionAnalysis: RepetitionAnalysis;
    dormancyAnalysis: DormancyAnalysis;
    deltaAnalysis: DeltaAnalysisResult;
    momentumAnalysis: MomentumData[];
    clusterStrengthAnalysis: ClusterStrengthData[];
}

export interface PerformancePoint {
    trainingSize: number;
    avgMainHits: number;
    avgStarHits: number;
}

export interface PerformanceLogItem {
    drawNumber: number;
    drawDate: string;
    forecast_top10_main: number[];
    forecast_top5_star: number[];
    actual_main: number[];
    actual_star: number[];
    mainHits: number;
    starHits: number;
    forecast_baseline_main?: number[];
    baselineMainHits?: number;
}

export interface HitProfile {
    hot: number;
    cold: number;
    overdue: number;
    hotZone: number;
    momentum: number;
    cluster: number;
}

export interface ForecastPerformanceInsight {
    hitProfile: HitProfile;
    conclusion: string;
    totalHits: number;
}

export interface SeasonalPerformance {
    period: string;
    totalDraws: number;
    totalHits: number;

    avgHits: number;
}

export interface PerformanceBreakdown {
    seasonal: {
        monthly: SeasonalPerformance[];
        quarterly: SeasonalPerformance[];
    };
    abTest: {
        aetherTotalHits: number;
        baselineTotalHits: number;
        improvementPercentage: number;
    };
}

export interface HistoricalSuccessProfile {
    hot: number;
    cold: number;
    overdue: number;
    hotZone: number;
    momentum: number;
    cluster: number;
    seasonal: number;
}

export interface PreDrawIndicator {
    title: string;
    insight: string;
    strength: 'Weak' | 'Moderate' | 'Strong';
}

export interface WinnerProfile {
    drawNumber: number;
    drawDate: string;
    winningNumber: number;
    profile: {
        isHot: boolean;
        isCold: boolean;
        isOverdue: boolean;
        isInHotZone: boolean;
        hasMomentum: boolean;
        hasClusterStrength: boolean;
        isSeasonalHot: boolean;
    };
    prevDrawSpread: number; 
}

export interface HistoricalSuccessAnalysis {
    hitProfile: HistoricalSuccessProfile;
    preDrawIndicators: PreDrawIndicator[];
    totalAnalyzedHits: number;
    winnerProfiles: WinnerProfile[];
}

export interface HotStreakAnalysis {
    averageStreakDuration: number;
    longestStreak: {
        number: number;
        duration: number;
    };
    streaksByNumber: { number: number; duration: number; }[];
}

export interface DormancyBreakAnalysis {
    avgSpreadBeforeBreak: number;
    globalAvgSpread: number;
    companionActivityIncrease: number; // Percentage increase in companion activity
}

export interface SeasonalTransition {
    fromPeriod: string;
    toPeriod: string;
    dissimilarityScore: number; // 0-1, higher is more different
}

export interface SeasonalTransitionAnalysis {
    monthlyTransitions: SeasonalTransition[];
    mostVolatileMonth: string;
    leastVolatileMonth: string;
}

export interface PatternTimingAnalysis {
    hotStreakAnalysis: HotStreakAnalysis;
    dormancyBreakAnalysis: DormancyBreakAnalysis;
    seasonalTransitionAnalysis: SeasonalTransitionAnalysis;
}