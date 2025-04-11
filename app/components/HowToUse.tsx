'use client';

import { useState } from 'react';

export default function HowToUse() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-gray-50 rounded-lg overflow-hidden transition-all duration-300 border border-gray-200 shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left text-blue-600 hover:text-blue-800 transition-colors"
            >
                <h3 className="text-lg font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    详细帮助说明
                </h3>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-5 text-gray-700 space-y-4 text-left">
                    <div>
                        <h4 className="font-medium text-blue-700 mb-2">如何查找GMGN API响应数据</h4>
                        <div className="space-y-3 mt-2">
                            <p>要找到您关注的钱包数据，请按照以下步骤操作：</p>
                            <ol className="list-decimal ml-5 space-y-2">
                                <li>在浏览器中打开并登录GMGN网站</li>
                                <li>打开浏览器开发者工具（按F12或右键选择&quot;检查&quot;）</li>
                                <li>切换到&quot;网络/Network&quot;标签页</li>
                                <li>在过滤框中输入&quot;following_wallets&quot;</li>
                                <li>刷新页面，查找名为&quot;following_wallets&quot;的网络请求</li>
                                <li>点击该请求，然后在右侧面板中选择&quot;响应/Response&quot;标签</li>
                                <li>复制全部JSON响应数据</li>
                            </ol>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-medium text-blue-700 mb-2">常见问题解答</h4>
                        <div className="space-y-3">
                            <div>
                                <p className="font-medium text-gray-800">看不到following_wallets请求怎么办？</p>
                                <p>请确保您已登录GMGN网站。尝试刷新页面，或切换到&quot;关注&quot;标签。确保过滤器输入正确，有时请求可能命名稍有不同。</p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">粘贴数据后显示格式错误？</p>
                                <p>请确保您复制了完整的JSON响应数据，包括开头的{`{`}和结尾的{`}`}。确保没有多余的文本或缺少部分内容。</p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">处理后的数据可以用在哪里？</p>
                                <p>处理后的数据符合其他钱包跟踪平台的导入格式，您可以将其保存为JSON文件或直接导入到支持此格式的平台。</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                        <h4 className="font-medium text-blue-700 mb-1">使用技巧</h4>
                        <ul className="list-disc ml-5 space-y-1">
                            <li>使用Chrome或Firefox获得最佳体验</li>
                            <li>第一次使用时可能需要刷新几次GMGN页面才能捕获到请求</li>
                            <li>如果遇到问题，尝试清除浏览器缓存后重新登录GMGN</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
} 