import { useNavigate } from 'react-router-dom';

function Backbutton({ title }) {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 w-full z-[100] p-4 pointer-events-none">
      {/* pointer-events-none: バー全体の透明部分はクリックを下に通す
         pointer-events-auto: ボタン部分だけクリックできるようにする
      */}
      <div className="flex items-center justify-between">
        
        {/* 共通の戻るボタン */}
        <button
          onClick={() => navigate(-1)}
          className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100 rounded-full text-gray-600 hover:text-blue-600 hover:bg-white transition-all active:scale-95"
        >
          {/* シンプルな矢印アイコン */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* 画面ごとのタイトル（必要なら表示、なければ空） */}
        {title && (
          <h1 className="pointer-events-auto text-sm font-bold text-gray-800 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-gray-100">
            {title}
          </h1>
        )}

        {/* 右側のバランス用（空のdiv） */}
        <div className="w-10" /> 
      </div>
    </div>
  );
}

export default Backbutton;