'use client';

import { useState, useRef, useEffect } from 'react';
import HowToUse from './components/HowToUse';
import LoadingSpinner from './components/LoadingSpinner';

// 定义GMGN API响应中的钱包数据类型
interface GMGNApiWallet {
  address: string;
  name: string | null;
  twitter_username?: string | null;
  twitter_name?: string | null;
  is_blue_verified?: boolean;
  avatar?: string | null;
  realized_profit_1d?: number;
  realized_profit_7d?: number;
  realized_profit_30d?: number;
  realized_pnl_30d?: number;
  total_profit?: number;
  total_profit_pnl?: number;
  last_active_timestamp?: number;
  eth_balance?: number;
  sol_balance?: number;
  trx_balance?: number;
  bnb_balance?: number;
  balance?: number;
  total_value?: number;
  followers_count?: number;
  swaps_1d?: number;
  swaps_7d?: number;
  swaps_30d?: number;
  description?: string | null;
  tag_rank?: Record<string, unknown>;
  tags?: string[];
  is_sticky?: boolean;
  tg_alert_enabled?: boolean;
  [key: string]: string | number | boolean | null | undefined | object | unknown[];
}

// 定义GMGN导出格式 - 简单的地址列表，部分带备注
interface GMGNExportItem {
  address: string;
  customName?: string | null;  // 可选的自定义备注
}

// 定义Axiom导出格式
interface AxiomExportItem {
  trackedWalletAddress: string;
  name: string;
  emoji: string;
  alertsOn: boolean;
}

// 定义GMGN API响应结构
interface GMGNResponse {
  code: number;
  msg: string;
  data: {
    followings: GMGNApiWallet[];
  };
}

// 钱包列表展示用的数据格式
interface WalletPreviewItem {
  walletAddress: string;
  displayName: string;
  customName?: string | null;
  hasCustomName: boolean;
  twitterUsername?: string | null;
  twitterName?: string | null;
  avatarUrl?: string | null;
  totalProfit?: number;
  totalProfitPnl?: number;
  kol?: boolean;
}

// 生成基于钱包地址的像素头像的函数
function generatePixelAvatar(address: string): string {
  // 钱包地址前10位用作种子
  const seed = address.slice(0, 10);

  // 定义四种鲜明的颜色
  const colorSets = [
    // 蓝色主题
    ['#4FC1E9', '#5D9CEC', '#7986CB', '#5C6BC0'],
    // 绿色主题
    ['#A0D468', '#8CC152', '#48CFAD', '#37BC9B'],
    // 红色主题
    ['#FC6E51', '#E9573F', '#ED5565', '#DA4453'],
    // 紫色主题
    ['#AC92EC', '#967ADC', '#D770AD', '#EC87C0'],
    // 橙黄色主题
    ['#FFCE54', '#F6BB42', '#E8AA14', '#F5AB35']
  ];

  // 安全地选择颜色主题
  let themeIndex = 0;
  try {
    // 尝试从地址中提取一个数字作为索引
    const hexValue = seed.replace(/[^0-9a-f]/gi, '').slice(0, 2) || '0';
    themeIndex = parseInt(hexValue, 16) % colorSets.length;
  } catch (e) {
    // 出错时使用默认索引0
    console.error('Error selecting theme:', e);
  }

  // 确保主题索引有效
  themeIndex = (themeIndex >= 0 && themeIndex < colorSets.length) ? themeIndex : 0;
  const colors = colorSets[themeIndex];

  // 设置背景色 - 与主题协调的深色
  const bgColors = ['#34495E', '#2C3E50', '#333333', '#3A539B', '#674172'];
  let bgColorIndex = 0;
  try {
    const hexValue = seed.replace(/[^0-9a-f]/gi, '').slice(2, 4) || '0';
    bgColorIndex = parseInt(hexValue, 16) % bgColors.length;
  } catch (e) {
    console.error('Error selecting background:', e);
  }

  // 确保背景色索引有效
  bgColorIndex = (bgColorIndex >= 0 && bgColorIndex < bgColors.length) ? bgColorIndex : 0;
  const bgColor = bgColors[bgColorIndex];

  // 创建8x8网格
  const size = 8;
  const grid = Array(size).fill(0).map(() => Array(size).fill(null));

  // 计算每个像素的填充状态（只考虑左半部分，右半会镜像）
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < Math.ceil(size / 2); x++) {
      // 使用钱包地址的不同部分计算填充概率
      const charIndex = (y * 4 + x) % seed.length;
      const charCode = seed.charCodeAt(charIndex) || 0;

      // 生成一个0-100的数值
      const value = charCode % 100;

      // 根据位置调整填充概率
      let fillProbability;
      if (y < 2 || y >= size - 2) { // 头部和底部区域
        fillProbability = 30; // 30%概率填充
      } else { // 中间区域
        fillProbability = 65; // 65%概率填充
      }

      // 决定是否填充
      if (value < fillProbability) {
        // 选择一种颜色（从四种颜色中选择一种）
        const colorIndex = Math.abs((charCode + y * x) % 4);
        grid[y][x] = colors[colorIndex];

        // 镜像到右侧
        if (x < Math.floor(size / 2)) {
          grid[y][size - 1 - x] = grid[y][x];
        }
      }
    }
  }

  // 生成SVG
  const pixelSize = 1;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * pixelSize}" height="${size * pixelSize}" viewBox="0 0 ${size} ${size}" style="background-color: ${bgColor};">`;

  // 添加像素
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x]) {
        svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${grid[y][x]}" />`;
      }
    }
  }

  svg += '</svg>';

  // 转换SVG为Data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// 像素头像组件
const PixelAvatar = ({ address }: { address: string }) => {
  const avatarUrl = generatePixelAvatar(address);

  return (
    <div className="h-10 w-10 rounded-md overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
      <img src={avatarUrl} alt="Pixel Avatar" className="h-full w-full" />
    </div>
  );
};

// 可能带有错误处理的头像组件
const WalletAvatar = ({ wallet }: { wallet: WalletPreviewItem }) => {
  const [hasError, setHasError] = useState(false);

  // 处理图片加载错误
  const handleImageError = () => {
    setHasError(true);
  };

  if (!wallet.avatarUrl || hasError) {
    return <PixelAvatar address={wallet.walletAddress} />;
  }

  return (
    <img
      src={wallet.avatarUrl}
      alt="Avatar"
      className="h-10 w-10 rounded-md"
      onError={handleImageError}
    />
  );
};

// 格式化利润为带K、M的简短形式
function formatProfitWithShorthand(profit: number): string {
  if (Math.abs(profit) >= 1000000) {
    return `$${(profit / 1000000).toFixed(1)}M`;
  } else if (Math.abs(profit) >= 1000) {
    return `$${(profit / 1000).toFixed(1)}K`;
  } else {
    return `$${profit.toFixed(1)}`;
  }
}

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [activeSection, setActiveSection] = useState(0); // 0: 首页, 1: 数据输入页, 2: 结果预览页
  const [pastedData, setPastedData] = useState('');
  const [exportedData, setExportedData] = useState<WalletPreviewItem[]>([]);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [editingWalletAddress, setEditingWalletAddress] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<WalletPreviewItem | null>(null);
  const [previewFormat, setPreviewFormat] = useState<'axiom' | 'gmgn'>('axiom'); // 新增状态跟踪预览格式
  const [copiedButton, setCopiedButton] = useState<'axiom' | 'gmgn' | null>(null); // 跟踪哪个按钮被点击
  // 排序状态
  const [sortConfig, setSortConfig] = useState<{
    key: 'totalProfit' | 'totalProfitPnl' | null;
    direction: 'ascending' | 'descending';
  }>({
    key: null,
    direction: 'descending'
  });

  // 创建引用来访问各区域DOM元素
  const sectionRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  // 处理排序请求
  const requestSort = (key: 'totalProfit' | 'totalProfitPnl') => {
    let direction: 'ascending' | 'descending' = 'descending';
    if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  // 获取排序后的数据
  const getSortedData = () => {
    if (!sortConfig.key) return exportedData;

    const sortableData = [...exportedData];
    sortableData.sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      // 处理undefined和null值
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return sortableData;
  };

  // 渲染排序图标
  const renderSortIcon = (key: 'totalProfit' | 'totalProfitPnl') => {
    if (sortConfig.key !== key) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortConfig.direction === 'ascending' ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // 滚动到指定部分
  const scrollToSection = (index: number) => {
    sectionRefs[index]?.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 监听exportedData变化，自动更新预览内容
  useEffect(() => {
    if (exportedData.length > 0) {
      updateJsonOutput();
    }
  }, [exportedData]);

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
      const exportData = parsedData.data.followings.map((wallet: GMGNApiWallet): WalletPreviewItem => {
        // 当twitter_name为null时，name就是用户的备注
        // 或者twitter_name与name不同时也是自定义备注
        const isCustomName = wallet.twitter_name === null || (wallet.twitter_name && wallet.twitter_name !== wallet.name);
        const displayName = wallet.name || wallet.address.substring(0, 8);

        // 获取用户真正的自定义备注（如果有）
        const customName = isCustomName ? wallet.name : null;

        // 检查tags数组是否包含"kol"
        const isKol = Array.isArray(wallet.tags) && wallet.tags.includes("kol");

        return {
          walletAddress: wallet.address,
          displayName: displayName,
          customName: customName,
          hasCustomName: Boolean(isCustomName),
          twitterUsername: wallet.twitter_username,
          twitterName: wallet.twitter_name,
          avatarUrl: wallet.avatar,
          totalProfit: wallet.total_profit,
          totalProfitPnl: wallet.total_profit_pnl,
          kol: isKol
        };
      });

      setExportedData(exportData);

      // 首先设置默认预览格式
      setPreviewFormat('gmgn');

      // 然后生成并更新预览内容
      const gmgnContent = generateGMGNFormat(exportData);
      setPreviewContent(gmgnContent);

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

  // 生成GMGN格式的数据
  const generateGMGNFormat = (data = exportedData) => {
    const gmgnData: GMGNExportItem[] = data.map(wallet => ({
      address: wallet.walletAddress,
      customName: wallet.hasCustomName && wallet.customName ? wallet.customName : null
    }));

    // 转换为GMGN文本格式: "地址:备注," 或只有地址
    return gmgnData.map(item => {
      return item.customName ?
        `${item.address}:${item.customName},` :
        `${item.address},`;
    }).join('\n');
  };

  // 生成Axiom格式的数据
  const generateAxiomFormat = (data = exportedData) => {
    // 可用的emoji列表
    const emojis = [
      // 交通工具
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚚', '🚛', '🚜', '🚲', '🛵', '🏍️', '🛺', '🚨',
      '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚊',
      '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢',

      // 动物
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉',
      '🙊', '🐒', '🦆', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱',
      '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕',
      '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧',
      '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐',

      // 食物
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅',
      '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨',
      '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆',

      // 物品与符号
      '💎', '🔮', '🎮', '🎯', '🎲', '🎭', '🎨', '🎬', '📷', '🎤', '🎧', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️',
      '🏆', '🏅', '🥇', '🥈', '🥉', '🏀', '🏐', '🏈', '⚾', '🥎', '🎾', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸',
      '🏒', '🏑', '🥍', '🏏', '🪃', '🥊', '🥋', '🪁', '⛳', '🏹', '🎣', '🤿', '🥌', '🛷', '🎿',

      // 表情与手势
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗',
      '😚', '😙', '🥲', '😋', '😛', '😜', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶',
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇',

      // 植物与自然
      '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🪴', '🪷', '⭐', '🌟', '✨',
      '⚡', '☄️', '💥', '🔥', '🌪️', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️'
    ];

    // 从名称生成确定性的emoji
    const getEmojiFromName = (name: string): string => {
      // 计算名称的简单哈希值
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash |= 0; // 转换为32位整数
      }

      // 使用绝对值确保索引为正
      const index = Math.abs(hash) % emojis.length;
      return emojis[index];
    };

    const axiomData: AxiomExportItem[] = data.map(wallet => ({
      trackedWalletAddress: wallet.walletAddress,
      name: wallet.displayName,
      emoji: getEmojiFromName(wallet.displayName), // 使用名称生成emoji
      alertsOn: true
    }));

    return JSON.stringify(axiomData, null, 2);
  };

  // 更新JSON输出和预览内容
  const updateJsonOutput = () => {
    // 当数据更新时，同时更新预览内容
    if (previewFormat === 'axiom') {
      setPreviewContent(generateAxiomFormat());
    } else {
      setPreviewContent(generateGMGNFormat());
    }
  };

  // 复制JSON数据到剪贴板
  const copyToClipboard = (format: 'axiom' | 'gmgn' = 'axiom') => {
    try {
      const content = format === 'axiom' ? generateAxiomFormat() : generateGMGNFormat();
      navigator.clipboard.writeText(content);
      setPreviewFormat(format);
      setPreviewContent(content);
      setCopiedButton(format);
      setStatus(`已复制${format === 'axiom' ? 'AXIOM' : 'GMGN'}格式到剪贴板！`);

      // 2秒后清除复制状态
      setTimeout(() => {
        setCopiedButton(null);
        setStatus('');
      }, 2000);
    } catch (error) {
      console.error('复制失败:', error);
      setStatus(`复制失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 下载为TXT文件
  const downloadAsTxt = (format: 'axiom' | 'gmgn' = 'axiom') => {
    try {
      const content = format === 'axiom' ? generateAxiomFormat() : generateGMGNFormat();
      const filename = format === 'axiom' ? 'axiom_wallets.txt' : 'gmgn_wallets.txt';

      // 创建Blob对象
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // 添加到DOM，触发点击，然后移除
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 释放URL对象
      URL.revokeObjectURL(url);

      setStatus(`已下载${format === 'axiom' ? 'AXIOM' : 'GMGN'}格式为TXT文件！`);

      // 2秒后清除状态
      setTimeout(() => {
        setStatus('');
      }, 2000);
    } catch (error) {
      console.error('下载失败:', error);
      setStatus(`下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 开始编辑钱包
  const startEdit = (walletAddress: string) => {
    const wallet = exportedData.find(w => w.walletAddress === walletAddress);
    if (wallet) {
      setEditingWalletAddress(walletAddress);
      setEditForm({ ...wallet });
    }
  };

  // 保存编辑
  const saveEdit = () => {
    if (editingWalletAddress && editForm) {
      const newData = exportedData.map(wallet =>
        wallet.walletAddress === editingWalletAddress ? editForm : wallet
      );
      setExportedData(newData);
      setEditingWalletAddress(null);
      setEditForm(null);
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingWalletAddress(null);
    setEditForm(null);
  };

  // 表单编辑处理
  const handleFormChange = (field: keyof WalletPreviewItem, value: string | boolean) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value
      });
    }
  };

  // 添加处理Twitter用户名编辑的功能
  const handleTwitterChange = (value: string) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        twitterUsername: value.trim() === '' ? null : value.trim()
      });
    }
  };

  // 添加处理自定义备注编辑的函数
  const handleCustomNameChange = (value: string) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        customName: value.trim() === '' ? null : value.trim(),
        // 更新显示名称和标记
        displayName: value.trim() === '' ? (editForm.twitterName || editForm.walletAddress.substring(0, 8)) : value.trim(),
        hasCustomName: value.trim() !== ''
      });
    }
  };

  // 删除钱包
  const deleteWallet = (walletAddress: string) => {
    const newData = exportedData.filter(wallet => wallet.walletAddress !== walletAddress);
    setExportedData(newData);
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
                GMGN Export
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
              <li>在浏览器中<a href="https://gmgn.ai/follow?chain=sol" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">登录GMGN网站</a>, 确保您在<a href="https://gmgn.ai/follow?chain=sol" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">关注页面</a></li>
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
                  <h3 className="text-base font-medium text-gray-700">
                    {previewFormat === 'axiom' ? 'AXIOM格式预览' : 'GMGN格式预览'}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard('gmgn')}
                      className={`px-4 py-2 rounded-lg font-medium text-white flex items-center text-sm ${previewFormat === 'gmgn' ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'} transition-all duration-300`}
                    >
                      {copiedButton === 'gmgn' ? (
                        <span className="mr-1 animate-pulse">✅</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      )}
                      复制GMGN格式
                    </button>
                    <button
                      onClick={() => downloadAsTxt('gmgn')}
                      className="px-4 py-2 rounded-lg font-medium text-white flex items-center text-sm bg-purple-600 hover:bg-purple-700 transition-all duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      下载GMGN格式
                    </button>
                    <button
                      onClick={() => copyToClipboard('axiom')}
                      className={`px-4 py-2 rounded-lg font-medium text-white flex items-center text-sm ${previewFormat === 'axiom' ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700'} transition-all duration-300`}
                    >
                      {copiedButton === 'axiom' ? (
                        <span className="mr-1 animate-pulse">✅</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      )}
                      复制AXIOM格式
                    </button>
                    <button
                      onClick={() => downloadAsTxt('axiom')}
                      className="px-4 py-2 rounded-lg font-medium text-white flex items-center text-sm bg-green-600 hover:bg-green-700 transition-all duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      下载AXIOM格式
                    </button>
                  </div>
                </div>
                <pre className="text-xs text-gray-700 bg-white p-3 rounded border border-gray-200 overflow-auto max-h-60">
                  {previewContent}
                </pre>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium text-gray-700">钱包列表 ({exportedData.length})</h3>
                  <div className="relative ml-2 group">
                    <div className="cursor-help text-gray-500 hover:text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="absolute left-0 top-6 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 text-sm text-gray-700 hidden group-hover:block">
                      <h4 className="font-bold mb-3 text-center border-b pb-2 border-gray-100">图标说明</h4>
                      <div className="space-y-4 mt-3">
                        <div className="flex items-center">
                          <div className="w-8 flex justify-center">
                            <img src="/icons8-x-logo.svg" alt="X" className="h-4 w-4" />
                          </div>
                          <span className="ml-3">Twitter链接</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 flex justify-center">
                            <img src="/twitter_verified_badge.svg" alt="KOL" className="w-3.5 h-3.5" />
                          </div>
                          <span className="ml-3">KOL账号</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 flex justify-center">
                            <span className="text-xs text-gray-500">[twitter]</span>
                          </div>
                          <span className="ml-3">Twitter用户名</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 flex justify-center">
                            <span className="border-b border-indigo-300 text-xs">名称</span>
                          </div>
                          <span className="ml-3">Twitter链接</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 flex justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </div>
                          <span className="ml-3">删除钱包</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 flex justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                          <span className="ml-3">编辑钱包</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="pl-4 pr-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                        <th className="pl-0 pr-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">钱包地址</th>
                        <th className="pl-6 pr-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">用户</th>
                        <th className="pl-8 pr-0 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                          <button
                            className="flex items-center outline-none focus:outline-none"
                            onClick={() => requestSort('totalProfit')}
                          >
                            总盈利
                            {renderSortIcon('totalProfit')}
                          </button>
                        </th>
                        <th className="pl-1 pr-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          <button
                            className="flex items-center outline-none focus:outline-none"
                            onClick={() => requestSort('totalProfitPnl')}
                          >
                            PNL
                            {renderSortIcon('totalProfitPnl')}
                          </button>
                        </th>
                        <th className="py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getSortedData().map((wallet) => (
                        <tr key={wallet.walletAddress} className={editingWalletAddress === wallet.walletAddress ? 'bg-blue-50' : ''}>
                          <td className="pl-4 pr-2 py-4 whitespace-nowrap">
                            <WalletAvatar wallet={wallet} />
                          </td>
                          <td className="pl-0 pr-2 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                            {editingWalletAddress === wallet.walletAddress ? (
                              <input
                                type="text"
                                value={editForm?.walletAddress || ''}
                                onChange={(e) => handleFormChange('walletAddress', e.target.value)}
                                className="w-full p-1 border border-gray-300 rounded"
                              />
                            ) : (
                              <div className="flex items-center">
                                <span>{wallet.walletAddress.substring(0, 8) + '...' + wallet.walletAddress.substring(wallet.walletAddress.length - 6)}</span>
                                {wallet.twitterUsername && (
                                  <div className="flex items-center ml-2">
                                    <a
                                      href={`https://twitter.com/${wallet.twitterUsername}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-black hover:text-gray-700 inline-flex items-center"
                                      title={`访问 @${wallet.twitterUsername} 的Twitter主页`}
                                    >
                                      <img src="/icons8-x-logo.svg" alt="X" className="h-4 w-4" />
                                    </a>
                                    {wallet.kol && (
                                      <span className="ml-1 flex-shrink-0 inline-flex items-center" title="KOL账号">
                                        <img src="/twitter_verified_badge.svg" alt="KOL" className="w-3.5 h-3.5" />
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          {editingWalletAddress === wallet.walletAddress ? (
                            // 编辑模式下的用户编辑区域，横跨多列
                            <td colSpan={3} className="px-2 py-4">
                              <div className="flex space-x-3">
                                <div className="flex-grow">
                                  <label className="block text-xs text-gray-500 mb-1">名称/备注</label>
                                  <input
                                    type="text"
                                    value={editForm?.displayName || ''}
                                    onChange={(e) => handleCustomNameChange(e.target.value)}
                                    className="w-full p-1.5 border border-gray-300 rounded"
                                    placeholder={editForm?.twitterName ? `默认: ${editForm.twitterName}` : "添加自定义备注"}
                                  />
                                </div>
                                <div className="w-52 relative">
                                  <label className="block text-xs text-gray-500 mb-1">Twitter用户名</label>
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                                    <input
                                      type="text"
                                      value={editForm?.twitterUsername || ''}
                                      onChange={(e) => handleTwitterChange(e.target.value)}
                                      placeholder="X用户名"
                                      className="w-full pl-6 p-1.5 border border-gray-300 rounded"
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                          ) : (
                            <>
                              <td className="pl-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex items-center max-w-[140px]">
                                  {wallet.twitterUsername ? (
                                    <a
                                      href={`https://twitter.com/${wallet.twitterUsername}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`font-medium truncate ${wallet.twitterName && !wallet.hasCustomName
                                        ? "border-b border-indigo-300"
                                        : "text-gray-700 border-b border-gray-300 hover:border-gray-600"
                                        }`}
                                      title={wallet.displayName}
                                    >
                                      {wallet.displayName}
                                    </a>
                                  ) : (
                                    <span
                                      className={`font-medium truncate ${wallet.twitterName && !wallet.hasCustomName
                                        ? "border-b border-indigo-300"
                                        : "text-gray-700"
                                        }`}
                                      title={wallet.displayName}
                                    >
                                      {wallet.displayName}
                                    </span>
                                  )}

                                  {wallet.twitterName && !wallet.hasCustomName && (
                                    <span className="ml-1 text-xs text-gray-500 flex-shrink-0">
                                      [twitter]
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="pl-8 pr-0 py-4 whitespace-nowrap text-sm">
                                {wallet.totalProfit !== undefined && (
                                  <span className={`font-medium ${wallet.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {wallet.totalProfit >= 0 ? '+' : ''}
                                    {formatProfitWithShorthand(wallet.totalProfit)}
                                  </span>
                                )}
                              </td>
                              <td className="pl-1 pr-1 py-4 whitespace-nowrap text-sm">
                                {wallet.totalProfitPnl !== undefined && (
                                  <span className={`font-medium ${wallet.totalProfitPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {wallet.totalProfitPnl >= 0 ? '+' : ''}
                                    {(wallet.totalProfitPnl * 100).toFixed(2)}%
                                  </span>
                                )}
                              </td>
                            </>
                          )}
                          <td className="py-4 whitespace-nowrap text-center text-sm font-medium">
                            {editingWalletAddress === wallet.walletAddress ? (
                              <div className="flex space-x-2 justify-center">
                                <button onClick={saveEdit} className="text-green-500 hover:text-green-700">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button onClick={cancelEdit} className="text-red-500 hover:text-red-700">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div className="flex space-x-2 justify-center">
                                <button
                                  onClick={() => deleteWallet(wallet.walletAddress)}
                                  className="text-red-500 hover:text-red-700"
                                  title="删除"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => startEdit(wallet.walletAddress)}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="编辑"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </div>
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
                    setPreviewContent('');
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
                <p className="text-gray-700">2. 点击&quot;复制GMGN格式&quot;可将数据以GMGN支持的格式复制到剪贴板。</p>
                <p className="text-gray-700">3. 点击&quot;复制AXIOM格式&quot;可将数据以AXIOM支持的格式复制到剪贴板。</p>
                <p className="text-gray-700">4. 点击&quot;下载GMGN格式&quot;或&quot;下载AXIOM格式&quot;可将数据保存为TXT文件到您的设备。</p>
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
