import { NextRequest, NextResponse } from 'next/server';
import { sitemapManagerService } from '../../../services/cloudinary/sitemap-manager.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    
    console.log(`[CloudinaryTest] Testing action: ${action}`);
    
    let result: any = {};
    
    switch (action) {
      case 'generate-all':
        console.log('[CloudinaryTest] Generating and uploading all sitemaps');
        result = await sitemapManagerService.generateAndUploadAllSitemaps();
        break;
        
      case 'status':
        console.log('[CloudinaryTest] Checking sitemap status');
        result = {
          status: await sitemapManagerService.checkSitemapStatus(),
          urls: await sitemapManagerService.getAllSitemapUrls(),
          latestUrl: await sitemapManagerService.getLatestSitemapUrl()
        };
        break;
        
      case 'list':
        console.log('[CloudinaryTest] Listing all sitemaps');
        result = await sitemapManagerService.listAllSitemaps();
        break;
        
      case 'info':
        console.log('[CloudinaryTest] Getting sitemap info');
        result = await sitemapManagerService.getAllSitemapInfo();
        break;
        
      case 'delete-all':
        console.log('[CloudinaryTest] Deleting all sitemaps');
        result = await sitemapManagerService.deleteAllSitemaps();
        break;
        
      case 'generate-home':
        console.log('[CloudinaryTest] Generating home sitemap');
        result = await sitemapManagerService.generateAndUploadSitemap('home');
        break;
        
      case 'generate-products':
        console.log('[CloudinaryTest] Generating products sitemap');
        result = await sitemapManagerService.generateAndUploadSitemap('products');
        break;
        
      case 'generate-static':
        console.log('[CloudinaryTest] Generating static sitemap');
        result = await sitemapManagerService.generateAndUploadSitemap('static');
        break;
        
      case 'generate-search':
        console.log('[CloudinaryTest] Generating search sitemap');
        result = await sitemapManagerService.generateAndUploadSitemap('search');
        break;
        
      case 'generate-index':
        console.log('[CloudinaryTest] Generating sitemap index');
        result = await sitemapManagerService.generateAndUploadSitemapIndex();
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          availableActions: [
            'status',
            'generate-all',
            'generate-home',
            'generate-products', 
            'generate-static',
            'generate-search',
            'generate-index',
            'list',
            'info',
            'delete-all'
          ]
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action,
      result
    });
    
  } catch (error) {
    console.error('[CloudinaryTest] Error:', error);
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
