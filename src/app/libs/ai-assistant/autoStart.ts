// Auto-start AI Assistant monitoring when server starts
import { reactiveMonitor } from './reactiveMonitor';
import { proactiveAnalyzer } from './proactiveAnalyzer';
import prisma from '@/app/libs/prismadb';

let isStarted = false;
let startAttempts = 0;
const MAX_START_ATTEMPTS = 1; // Only allow 1 start attempt

export async function autoStartAIAssistant() {
  // Prevent multiple starts
  if (isStarted) {
    console.log('🤖 AI Assistant: Already started - ignoring duplicate start request');
    return;
  }

  // Prevent too many start attempts
  startAttempts++;
  if (startAttempts > MAX_START_ATTEMPTS) {
    console.log(`🤖 AI Assistant: Max start attempts (${MAX_START_ATTEMPTS}) reached - ignoring`);
    return;
  }

  try {
    // Check if AI Assistant is enabled
    const settings = await prisma.adminSettings.findFirst();
    const isEnabled = settings?.aiAssistantEnabled ?? true;

    if (isEnabled) {
      console.log(`🤖 Auto-starting AI Assistant monitoring (attempt ${startAttempts})...`);

      // Start both reactive (emergency) and proactive (strategic) monitoring
      await Promise.all([reactiveMonitor.startEmergencyMonitoring(), proactiveAnalyzer.startStrategicAnalysis()]);

      isStarted = true;
      console.log('✅ AI Assistant monitoring auto-started successfully');
      console.log('  - 🚨 ReactiveMonitor: Emergency alerts (30s interval)');
      console.log('  - 🤖 ProactiveAnalyzer: Strategic recommendations (2min interval)');
      console.log('  - 📊 EventMonitor: REMOVED - functionality merged into above monitors');
    } else {
      console.log('🤖 AI Assistant is disabled - skipping auto-start');
    }
  } catch (error) {
    console.error('❌ Failed to auto-start AI Assistant:', error);
  }
}

// Auto-start when this module is imported
if (typeof window === 'undefined') {
  // Only on server-side
  // Delay to ensure database is ready
  setTimeout(() => {
    autoStartAIAssistant();
  }, 5000); // 5 seconds delay
}
