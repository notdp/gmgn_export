'use client';

import { useState, useRef, useEffect } from 'react';
import HowToUse from './components/HowToUse';
import LoadingSpinner from './components/LoadingSpinner';

// 定义GMGN API响应中的钱包数据类型
interface GMGNWalletData {
  address: string;
  name: string | null;
  [key: string]: string | number | boolean | null | undefined | object | unknown[];
}

// 定义GMGN API响应结构
interface GMGNResponse {
  code: number;
  msg: string;
  data: {
    followings: GMGNWalletData[];
  };
}

// 定义导出数据格式
interface ExportedWallet {
  trackedWalletAddress: string;
  name: string;
  emoji: string;
  alertsOn: boolean;
}

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [activeSection, setActiveSection] = useState(0); // 0: 首页, 1: 数据输入页, 2: 结果预览页
  const [pastedData, setPastedData] = useState('');
  const [exportedData, setExportedData] = useState<ExportedWallet[]>([]);
  const [exportedJson, setExportedJson] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ExportedWallet | null>(null);

  // 创建引用来访问各区域DOM元素
  const sectionRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  // 滚动到指定部分
  const scrollToSection = (index: number) => {
    sectionRefs[index]?.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 处理滚动事件，更新当前活跃部分
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 3; // 添加一些偏移量以便更准确地确定当前部分

      // 找出当前可见的部分
      for (let i = 0; i < sectionRefs.length; i++) {
        const current = sectionRefs[i].current;
        if (current) {
          const { offsetTop, offsetHeight } = current;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(i);
            break;
          }
        }
      }
    };

    // 添加滚动事件监听
    window.addEventListener('scroll', handleScroll);
    // 初始化调用一次，设置初始活跃部分
    handleScroll();

    // 清理函数
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 处理用户粘贴的JSON数据
  const processData = () => {
    try {
      setIsProcessing(true);
      setStatus('正在处理数据...');

      if (!pastedData.trim()) {
        throw new Error('请先粘贴GMGN关注钱包数据');
      }

      // 尝试解析用户粘贴的JSON数据
      const parsedData = JSON.parse(pastedData) as GMGNResponse;

      // 检查数据格式是否符合预期
      if (!parsedData.data || !parsedData.data.followings || !Array.isArray(parsedData.data.followings)) {
        throw new Error('数据格式不正确，请确保复制了完整的API响应');
      }

      // 转换数据格式
      const exportData = parsedData.data.followings.map((wallet: GMGNWalletData): ExportedWallet => ({
        trackedWalletAddress: wallet.address,
        name: wallet.name || wallet.address.substring(0, 8),
        emoji: '👻',
        alertsOn: true
      }));

      setExportedData(exportData);
      updateJsonOutput(exportData);
      setStatus('处理成功！');

      // 处理完成后滚动到结果部分
      setTimeout(() => {
        scrollToSection(2);
      }, 300);
    } catch (error) {
      console.error('处理失败:', error);
      setStatus(`处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 更新JSON输出
  const updateJsonOutput = (data: ExportedWallet[]) => {
    const jsonData = JSON.stringify(data, null, 2);
    setExportedJson(jsonData);
  };

  // 开始编辑钱包
  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...exportedData[index] });
  };

  // 保存编辑
  const saveEdit = () => {
    if (editingIndex !== null && editForm) {
      const newData = [...exportedData];
      newData[editingIndex] = editForm;
      setExportedData(newData);
      updateJsonOutput(newData);
      setEditingIndex(null);
      setEditForm(null);
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  // 表单编辑处理
  const handleFormChange = (field: keyof ExportedWallet, value: string | boolean) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value
      });
    }
  };

  // 复制JSON数据到剪贴板
  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportedJson);
    setStatus('已复制到剪贴板！');
    setTimeout(() => setStatus(''), 2000);
  };

  // 渲染导航指示器
  const renderNavigator = () => {
    return (
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-10">
        <div className="flex flex-col items-center">
          {[0, 1, 2].map((num) => (
            <div key={num} className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${activeSection >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  } cursor-pointer hover:bg-blue-500 hover:text-white transition-colors shadow-md`}
                onClick={() => scrollToSection(num)}
              >
                {num + 1}
              </div>
              {num < 2 && (
                <div className="h-8 w-0.5 bg-gray-300"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-100 text-gray-800">
      {renderNavigator()}

      {/* 首页 */}
      <div
        ref={sectionRefs[0]}
        className="min-h-screen w-full flex flex-col items-center justify-center py-16 px-6"
      >
        <div className="max-w-4xl w-full">
          <div className="text-center">
            <div className="mb-16">
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
                WalletBeam
              </h1>
              <p className="text-xl text-gray-600 mb-8">一键导出您在GMGN平台关注的钱包地址</p>
              <p className="text-gray-600 max-w-2xl mx-auto">
                本工具可以帮助您将GMGN平台关注的钱包数据转换为通用格式，便于导入其他钱包监控工具。
                所有处理在您的浏览器中完成，无需担心数据泄露。
              </p>
            </div>

            <button
              onClick={() => scrollToSection(1)}
              className="px-10 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white text-lg shadow-lg transform hover:scale-105 transition-all"
            >
              开始处理
            </button>

            <div className="mt-16">
              <HowToUse />
            </div>

            <div className="mt-8 bg-white/80 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-medium text-amber-700 mb-3">注意事项</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li className="pl-2">本工具不会存储您的任何数据</li>
                <li className="pl-2">所有数据处理都在您的浏览器中完成，不会上传到任何服务器</li>
                <li className="pl-2">如遇到问题，请确保您在GMGN网站正确复制了API响应数据</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 数据输入页 */}
      <div
        ref={sectionRefs[1]}
        className="min-h-screen w-full flex flex-col items-center justify-center pt-8 pb-16 px-6"
      >
        <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl p-8 my-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center">粘贴GMGN数据</h2>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-700 mb-2">如何获取数据：</h3>
            <ol className="list-decimal list-inside text-left space-y-2 text-gray-600">
              <li>在浏览器中<a href="https://gmgn.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">登录GMGN网站</a></li>
              <li>同时按下 <kbd className="px-2 py-1 bg-gray-200 rounded">F12</kbd> 键或右键点击页面选择&quot;检查&quot;打开开发者工具</li>
              <li>切换到 <strong>网络/Network</strong> 标签</li>
              <li>在搜索框中输入 <code className="px-2 py-1 bg-gray-200 rounded">following_wallets</code></li>
              <li>刷新GMGN网页</li>
              <li>在网络请求列表中找到并点击 <code className="px-2 py-1 bg-gray-200 rounded">following_wallets</code> 请求</li>
              <li>在右侧窗口中切换到 <strong>响应/Response</strong> 标签</li>
              <li>全选(<kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+A</kbd>)并复制(<kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+C</kbd>)响应内容</li>
            </ol>
          </div>

          <div className="mb-6">
            <textarea
              placeholder="在这里粘贴从GMGN网站复制的JSON数据..."
              className="w-full h-60 p-4 bg-gray-50 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => scrollToSection(0)}
              className="px-6 py-3 bg-gray-400 hover:bg-gray-500 rounded-lg font-medium text-white"
            >
              返回
            </button>
            <button
              onClick={processData}
              disabled={isProcessing || !pastedData.trim()}
              className={`px-8 py-3 rounded-lg font-medium flex items-center space-x-2 ${isProcessing || !pastedData.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              {isProcessing && <LoadingSpinner />}
              <span>{isProcessing ? '处理中...' : '处理数据'}</span>
            </button>
          </div>

          {status && status.includes('失败') && (
            <div className="mt-4 p-4 rounded-lg bg-red-100 text-red-800 border border-red-300">
              {status}
            </div>
          )}
        </div>
      </div>

      {/* 结果预览页 */}
      <div
        ref={sectionRefs[2]}
        className="min-h-screen w-full flex flex-col items-start pt-12 pb-20 px-6"
      >
        <div className="max-w-4xl w-full mx-auto bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">结果预览</h2>

          {exportedData.length > 0 ? (
            <div className="mb-8">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-medium text-gray-700">JSON数据预览</h3>
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-white flex items-center text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    复制JSON
                  </button>
                </div>
                <pre className="text-xs text-gray-700 bg-white p-3 rounded border border-gray-200 overflow-auto max-h-60">
                  {exportedJson}
                </pre>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-700">钱包列表 ({exportedData.length})</h3>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">钱包地址</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">表情</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">通知</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {exportedData.map((wallet, index) => (
                        <tr key={wallet.trackedWalletAddress} className={editingIndex === index ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={editForm?.trackedWalletAddress || ''}
                                onChange={(e) => handleFormChange('trackedWalletAddress', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded"
                              />
                            ) : (
                              wallet.trackedWalletAddress.substring(0, 8) + '...' + wallet.trackedWalletAddress.substring(wallet.trackedWalletAddress.length - 6)
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={editForm?.name || ''}
                                onChange={(e) => handleFormChange('name', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded"
                              />
                            ) : (
                              wallet.name
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={editForm?.emoji || ''}
                                onChange={(e) => handleFormChange('emoji', e.target.value)}
                                className="w-20 p-1 border border-gray-300 rounded"
                              />
                            ) : (
                              wallet.emoji
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingIndex === index ? (
                              <input
                                type="checkbox"
                                checked={editForm?.alertsOn || false}
                                onChange={(e) => handleFormChange('alertsOn', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            ) : (
                              wallet.alertsOn ? '开启' : '关闭'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {editingIndex === index ? (
                              <div className="flex space-x-2 justify-end">
                                <button onClick={saveEdit} className="text-green-600 hover:text-green-900">保存</button>
                                <button onClick={cancelEdit} className="text-red-600 hover:text-red-900">取消</button>
                              </div>
                            ) : (
                              <button onClick={() => startEdit(index)} className="text-blue-600 hover:text-blue-900">编辑</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {status && status.includes('成功') && (
                <div className="p-3 mb-4 rounded-lg bg-green-100 text-green-800 border border-green-300">
                  {status}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => scrollToSection(1)}
                  className="px-6 py-3 bg-gray-400 hover:bg-gray-500 rounded-lg font-medium text-white"
                >
                  返回
                </button>
                <button
                  onClick={() => {
                    setPastedData('');
                    setExportedData([]);
                    setExportedJson('');
                    setStatus('');
                    scrollToSection(0);
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white"
                >
                  重新开始
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h3 className="font-medium text-blue-700 mb-2">提示：</h3>
                <p className="text-gray-700">1. 您可以通过点击&quot;编辑&quot;来修改每个钱包的信息。</p>
                <p className="text-gray-700">2. 点击&quot;复制JSON&quot;可将数据复制到剪贴板，便于导入其他平台。</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>请先在上一步处理GMGN数据</p>
              <button
                onClick={() => scrollToSection(1)}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white"
              >
                返回数据输入
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="w-full py-6 text-center text-gray-500 text-sm bg-gray-100 border-t border-gray-200 mt-12">
        WalletBeam - 非官方工具 © 2025 |
        <a href="https://github.com/notdp/gmgn_export" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
          GitHub
        </a>
      </footer>
    </main>
  );
}
