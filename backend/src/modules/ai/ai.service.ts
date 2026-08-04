import { db } from '../../db/client';
import { aiUsageTracking, generatedReports } from '../../db/schema';
import { eq, and, desc, gte, lte, sum } from 'drizzle-orm';

export interface AiUsageFilters {
  customerId?: number;
  feature?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface TrackAiUsageRequest {
  customerId: number;
  feature: 'agent_chat' | 'report_generation' | 'analysis' | 'automation';
  tokensUsed?: number;
  metadata?: any;
}

export interface AiUsageLimits {
  customerId: number;
  planId: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  totalTokensUsed: number;
  requestsRemaining: number;
  resetDate: Date;
}

export interface AiFeatureRequest {
  customerId: number;
  feature: 'agent_chat' | 'report_generation' | 'analysis' | 'automation';
  prompt: string;
  context?: any;
  priority?: 'low' | 'medium' | 'high';
}

export class AiAssistanceService {
  // Track AI usage
  async trackUsage(data: TrackAiUsageRequest): Promise<any> {
    try {
      const usageRecord = {
        customerId: data.customerId,
        feature: data.feature,
        tokensUsed: data.tokensUsed || 0,
        requestsCount: 1,
        usageDate: new Date(),
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      };
      
      const result = await db.insert(aiUsageTracking).values(usageRecord).returning();
      return result[0];
    } catch (error) {
      console.error('Error tracking AI usage:', error);
      throw error;
    }
  }

  // Get AI usage with filters
  async getUsage(filters?: AiUsageFilters): Promise<any[]> {
    let query = db.select().from(aiUsageTracking).$dynamic();
    
    const conditions = [];
    
    if (filters?.customerId !== undefined) {
      conditions.push(eq(aiUsageTracking.customerId, filters.customerId));
    }
    
    if (filters?.feature !== undefined) {
      conditions.push(eq(aiUsageTracking.feature, filters.feature));
    }
    
    if (filters?.dateFrom !== undefined) {
      conditions.push(gte(aiUsageTracking.usageDate, filters.dateFrom));
    }
    
    if (filters?.dateTo !== undefined) {
      conditions.push(lte(aiUsageTracking.usageDate, filters.dateTo));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(aiUsageTracking.usageDate));
  }

  // Get usage statistics
  async getUsageStatistics(customerId: number, period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<{
    totalTokensUsed: number;
    totalRequests: number;
    averageTokensPerRequest: number;
    featureBreakdown: { feature: string; tokens: number; requests: number }[];
    periodTrend: { date: string; tokens: number; requests: number }[];
  }> {
    try {
      const now = new Date();
      let dateFrom: Date;
      
      switch (period) {
        case 'daily':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      const usageData = await this.getUsage({
        customerId,
        dateFrom,
        dateTo: now
      });

      const totalTokensUsed = usageData.reduce((sum, usage) => sum + (usage.tokensUsed || 0), 0);
      const totalRequests = usageData.reduce((sum, usage) => sum + usage.requestsCount, 0);
      const averageTokensPerRequest = totalRequests > 0 ? totalTokensUsed / totalRequests : 0;

      // Feature breakdown
      const featureMap = new Map<string, { tokens: number; requests: number }>();
      usageData.forEach(usage => {
        const current = featureMap.get(usage.feature) || { tokens: 0, requests: 0 };
        featureMap.set(usage.feature, {
          tokens: current.tokens + (usage.tokensUsed || 0),
          requests: current.requests + usage.requestsCount
        });
      });

      const featureBreakdown = Array.from(featureMap.entries()).map(([feature, data]) => ({
        feature,
        ...data
      }));

      // Period trend
      const periodTrend = this.calculatePeriodTrend(usageData, period);

      return {
        totalTokensUsed,
        totalRequests,
        averageTokensPerRequest,
        featureBreakdown,
        periodTrend
      };
    } catch (error) {
      console.error('Error calculating usage statistics:', error);
      return {
        totalTokensUsed: 0,
        totalRequests: 0,
        averageTokensPerRequest: 0,
        featureBreakdown: [],
        periodTrend: []
      };
    }
  }

  // Check if customer can use AI feature (based on subscription)
  async canUseAiFeature(customerId: number, feature: string): Promise<{
    canUse: boolean;
    reason?: string;
    currentUsage?: any;
    limits?: any;
  }> {
    try {
      // Get customer's subscription and check AI limits
      // This would integrate with billing service
      // For now, implement basic logic
      
      const currentUsage = await this.getUsageStatistics(customerId, 'monthly');
      const monthlyLimit = 100000; // Default limit for paid plans
      
      const canUse = currentUsage.totalTokensUsed < monthlyLimit;
      
      return {
        canUse,
        reason: canUse ? undefined : 'AI usage limit exceeded for current billing plan',
        currentUsage,
        limits: { monthlyLimit }
      };
    } catch (error) {
      console.error('Error checking AI usage limits:', error);
      return {
        canUse: false,
        reason: 'Failed to check usage limits'
      };
    }
  }

  // Process AI feature request
  async processAiRequest(request: AiFeatureRequest): Promise<{
    success: boolean;
    response?: any;
    usage?: any;
    error?: string;
  }> {
    try {
      // Check if customer can use this feature
      const canUse = await this.canUseAiFeature(request.customerId, request.feature);
      
      if (!canUse.canUse) {
        return {
          success: false,
          error: canUse.reason || 'AI feature not available'
        };
      }

      // Estimate tokens for this request
      const estimatedTokens = this.estimateTokens(request.prompt);

      // Track usage before processing
      const usage = await this.trackUsage({
        customerId: request.customerId,
        feature: request.feature,
        tokensUsed: estimatedTokens,
        metadata: {
          prompt: request.prompt,
          context: request.context,
          priority: request.priority
        }
      });

      // Process the AI request (integrate with your AI service)
      const aiResponse = await this.callAiService(request);

      // Update usage with actual tokens used
      if (aiResponse.tokensUsed) {
        await this.updateUsage(usage.id, {
          tokensUsed: aiResponse.tokensUsed
        });
      }

      return {
        success: true,
        response: aiResponse.response,
        usage,
        error: undefined
      };
    } catch (error) {
      console.error('Error processing AI request:', error);
      return {
        success: false,
        error: 'Failed to process AI request'
      };
    }
  }

  // Get AI insights and recommendations
  async getAiInsights(customerId: number): Promise<{
    usageTrends: any[];
    optimizationSuggestions: string[];
    costAnalysis: any;
    featureUtilization: any;
  }> {
    try {
      const monthlyUsage = await this.getUsageStatistics(customerId, 'monthly');
      const weeklyUsage = await this.getUsageStatistics(customerId, 'weekly');
      
      // Usage trends
      const usageTrends = [
        {
          period: 'Last 7 days',
          averageDailyTokens: weeklyUsage.totalTokensUsed / 7,
          averageDailyRequests: weeklyUsage.totalRequests / 7
        },
        {
          period: 'Last 30 days',
          averageDailyTokens: monthlyUsage.totalTokensUsed / 30,
          averageDailyRequests: monthlyUsage.totalRequests / 30
        }
      ];

      // Optimization suggestions
      const optimizationSuggestions = this.generateOptimizationSuggestions(monthlyUsage);

      // Cost analysis
      const costAnalysis = {
        estimatedMonthlyCost: monthlyUsage.totalTokensUsed * 0.0001, // $0.0001 per token
        costPerRequest: monthlyUsage.totalTokensUsed / monthlyUsage.totalRequests * 0.0001,
        potentialSavings: this.calculatePotentialSavings(monthlyUsage)
      };

      // Feature utilization
      const featureUtilization = monthlyUsage.featureBreakdown.map(feature => ({
        ...feature,
        utilizationPercentage: (feature.tokens / monthlyUsage.totalTokensUsed) * 100
      }));

      return {
        usageTrends,
        optimizationSuggestions,
        costAnalysis,
        featureUtilization
      };
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return {
        usageTrends: [],
        optimizationSuggestions: [],
        costAnalysis: {},
        featureUtilization: []
      };
    }
  }

  // Reset usage limits (for billing cycle reset)
  async resetUsageLimits(customerId: number): Promise<void> {
    try {
      // This would be called when billing cycle resets
      // Mark all usage as archived or create new records
      const now = new Date();
      
      // In a real implementation, you might archive old records
      // or update a customer record with reset date
      
      console.log(`AI usage limits reset for customer ${customerId} at ${now.toISOString()}`);
    } catch (error) {
      console.error('Error resetting AI usage limits:', error);
    }
  }

  // Helper methods
  private calculatePeriodTrend(usageData: any[], period: 'daily' | 'weekly' | 'monthly'): any[] {
    const periodMap = new Map<string, { tokens: number; requests: number }>();
    
    usageData.forEach(usage => {
      let periodKey: string;
      
      switch (period) {
        case 'daily':
          periodKey = new Date(usage.usageDate).toLocaleDateString();
          break;
        case 'weekly':
          const weekStart = new Date(usage.usageDate.getTime() - (new Date(usage.usageDate).getDay() * 24 * 60 * 60 * 1000));
          periodKey = `Week ${Math.ceil((usage.usageDate.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
          break;
        case 'monthly':
          periodKey = new Date(usage.usageDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          break;
      }
      
      const current = periodMap.get(periodKey) || { tokens: 0, requests: 0 };
      periodMap.set(periodKey, {
        tokens: current.tokens + (usage.tokensUsed || 0),
        requests: current.requests + usage.requestsCount
      });
    });

    return Array.from(periodMap.entries()).map(([period, data]) => ({ period, ...data }));
  }

  private estimateTokens(prompt: string): number {
    // Simple token estimation (would use actual tokenizer in production)
    return Math.ceil(prompt.length / 4);
  }

  private async updateUsage(usageId: number, data: any): Promise<void> {
    try {
      await db
        .update(aiUsageTracking)
        .set(data)
        .where(eq(aiUsageTracking.id, usageId));
    } catch (error) {
      console.error('Error updating usage record:', error);
    }
  }

  private async callAiService(request: AiFeatureRequest): Promise<any> {
    // This would integrate with your actual AI service
    // For now, return a mock response
    
    const responses: Record<string, { response: string; tokensUsed: number }> = {
      agent_chat: {
        response: "I understand your request. Let me help you with that.",
        tokensUsed: this.estimateTokens(request.prompt)
      },
      report_generation: {
        response: "Report generated successfully based on your parameters.",
        tokensUsed: this.estimateTokens(request.prompt)
      },
      analysis: {
        response: "Analysis complete. Here are the key insights from your data.",
        tokensUsed: this.estimateTokens(request.prompt)
      },
      automation: {
        response: "Automation task completed successfully.",
        tokensUsed: this.estimateTokens(request.prompt)
      }
    };

    return responses[request.feature] || {
      response: "Feature not available",
      tokensUsed: 0
    };
  }

  private generateOptimizationSuggestions(monthlyUsage: any): string[] {
    const suggestions: string[] = [];
    
    if (monthlyUsage.totalTokensUsed > 50000) {
      suggestions.push("Consider upgrading to a higher tier plan for better AI rates");
    }
    
    if (monthlyUsage.averageTokensPerRequest > 1000) {
      suggestions.push("Optimize your prompts to be more concise and reduce token usage");
    }
    
    const mostUsedFeature = monthlyUsage.featureBreakdown.reduce((max: any, feature: any) => 
      feature.tokens > max.tokens ? feature : max
    , { tokens: 0, requests: 0 });
    
    if (mostUsedFeature.feature) {
      suggestions.push(`Your most used feature is ${mostUsedFeature.feature}. Consider exploring advanced features for better ROI.`);
    }
    
    return suggestions;
  }

  private calculatePotentialSavings(usage: any): number {
    // Calculate potential savings with optimization
    const currentCost = usage.totalTokensUsed * 0.0001;
    const optimizedCost = usage.totalTokensUsed * 0.8 * 0.0001; // Assume 20% optimization
    return currentCost - optimizedCost;
  }

  // Get AI feature recommendations based on usage patterns
  async getFeatureRecommendations(customerId: number): Promise<{
    recommendedFeatures: string[];
    underutilizedFeatures: string[];
    upgradeSuggestions: string[];
  }> {
    try {
      const usageStats = await this.getUsageStatistics(customerId, 'monthly');
      
      const recommendedFeatures: string[] = [];
      const underutilizedFeatures: string[] = [];
      const upgradeSuggestions: string[] = [];
      
      // Analyze feature usage
      usageStats.featureBreakdown.forEach(feature => {
        const utilizationPercentage = (feature.tokens / usageStats.totalTokensUsed) * 100;
        
        if (utilizationPercentage < 5) {
          underutilizedFeatures.push(`${feature.feature} (${utilizationPercentage.toFixed(1)}% utilization)`);
        } else if (utilizationPercentage > 50) {
          recommendedFeatures.push(feature.feature);
        }
      });
      
      // Suggest upgrades or optimizations
      if (usageStats.totalTokensUsed > 80000) {
        upgradeSuggestions.push("Consider upgrading to unlimited AI plan for cost efficiency");
      }
      
      return {
        recommendedFeatures,
        underutilizedFeatures,
        upgradeSuggestions
      };
    } catch (error) {
      console.error('Error generating feature recommendations:', error);
      return {
        recommendedFeatures: [],
        underutilizedFeatures: [],
        upgradeSuggestions: []
      };
    }
  }
}
