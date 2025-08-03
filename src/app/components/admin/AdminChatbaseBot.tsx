'use client';

import React, { useEffect } from 'react';

interface AdminChatbaseBotProps {
  className?: string;
}

/**
 * Admin Chatbase Bot Component using Chat Bubble
 * Provides AI assistance for admin tasks with business context
 */
const AdminChatbaseBot: React.FC<AdminChatbaseBotProps> = ({ className = '' }) => {
  useEffect(() => {
    // Load Chatbase chat bubble script for admin
    const loadChatbaseScript = () => {
      // Check if script already exists
      if (document.getElementById('chatbase-admin-script')) {
        return;
      }

      // Create and inject the Chatbase script
      const script = document.createElement('script');
      script.innerHTML = `
        (function(){
          if(!window.chatbase||window.chatbase("getState")!=="initialized"){
            window.chatbase=(...arguments)=>{
              if(!window.chatbase.q){window.chatbase.q=[]}
              window.chatbase.q.push(arguments)
            };
            window.chatbase=new Proxy(window.chatbase,{
              get(target,prop){
                if(prop==="q"){return target.q}
                return(...args)=>target(prop,...args)
              }
            })
          }
          const onLoad=function(){
            const script=document.createElement("script");
            script.src="https://www.chatbase.co/embed.min.js";
            script.id="otpZppmosyD1EdQrPcONm";
            script.domain="www.chatbase.co";
            document.body.appendChild(script)
          };
          if(document.readyState==="complete"){
            onLoad()
          }else{
            window.addEventListener("load",onLoad)
          }
        })();
      `;
      script.id = 'chatbase-admin-script';
      document.head.appendChild(script);
    };

    loadChatbaseScript();

    // Cleanup function
    return () => {
      const script = document.getElementById('chatbase-admin-script');
      if (script) {
        script.remove();
      }
      // Remove chatbase bubble if exists
      const chatbaseElements = document.querySelectorAll('[id^="chatbase"]');
      chatbaseElements.forEach(el => el.remove());
    };
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center h-96 bg-gradient-to-br from-blue-50 to-indigo-100 border border-gray-200 rounded-lg shadow-sm ${className}`}
    >
      {/* Admin Chatbot Info */}
      <div className='text-center p-8'>
        <div className='w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4'>
          <span className='text-white text-2xl font-bold'>AI</span>
        </div>

        <h3 className='text-xl font-semibold text-gray-900 mb-2'>Admin AI Assistant</h3>

        <p className='text-gray-600 mb-4 max-w-md'>
          Chatbase AI sẽ xuất hiện dưới dạng chat bubble ở góc phải màn hình. Hỗ trợ phân tích dữ liệu kinh doanh,
          insights và recommendations.
        </p>

        <div className='flex items-center justify-center space-x-2 text-sm text-green-600'>
          <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
          <span>Chat bubble đã được kích hoạt</span>
        </div>

        {/* Quick Tips */}
        <div className='mt-6 p-4 bg-white rounded-lg border border-gray-200'>
          <h4 className='font-medium text-gray-900 mb-2'>💡 Gợi ý câu hỏi:</h4>
          <div className='text-sm text-gray-600 space-y-1'>
            <div>• Phân tích doanh số tuần này</div>
            <div>• Sản phẩm nào bán chạy nhất?</div>
            <div>• Tình hình inventory hiện tại?</div>
            <div>• Đề xuất chiến lược marketing</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChatbaseBot;
