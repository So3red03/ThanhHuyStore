import Link from 'next/link';
import { slugConvert } from '../../utils/Slug';
import { format } from 'date-fns';

interface RelatedArticlesProps {
  articleList: any;
  article: any;
}
const RelatedArticles: React.FC<RelatedArticlesProps> = ({ articleList, article }) => {
  return (
    <div className='relative m-auto mt-[40px] w-full sm:max-w-[95%] md:max-w-[90%]'>
      <div className='w-full'>
        <h2 className=' mb-[15px] block w-fit select-none text-xl font-[600] md:text-2xl'>
          Bài viết liên quan
          <span className='mt-[5px] block w-[70%] border-b-[3px] border-slate-300' />
        </h2>
        <div className='grid w-full grid-cols-1 gap-[15px] md:grid-cols-2 md:gap-[20px]'>
          {articleList.map((item: any, index: any) =>
            item.id === article.id ? null : (
              <div key={item.id} className='flex w-full gap-[10px]'>
                <Link
                  className='relative block aspect-16/9 w-full max-w-[35%] flex-shrink-0'
                  href={`/article/${slugConvert(item.title)}-${item.id}`}
                >
                  <img
                    alt={item.title}
                    title={item.title}
                    loading='lazy'
                    width={200}
                    height={200}
                    decoding='async'
                    data-nimg={1}
                    className='h-full w-full rounded-[5px] object-cover'
                    src={item.image}
                  />
                </Link>
                <div className='flex flex-1 flex-col gap-[5px]'>
                  <Link
                    className='text-xs font-[500] hover:text-blue-500 md:text-sm'
                    href={`/article/${slugConvert(item.title)}-${item.id}`}
                  >
                    <h3>{item.title}</h3>
                  </Link>
                  <div className='flex items-center gap-[2px]  font-[500] text-blue-500 text-xs'>
                    <svg
                      stroke='currentColor'
                      fill='none'
                      strokeWidth={0}
                      viewBox='0 0 15 15'
                      height={15}
                      width={15}
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        fillRule='evenodd'
                        clipRule='evenodd'
                        d='M0.877014 7.49988C0.877014 3.84219 3.84216 0.877045 7.49985 0.877045C11.1575 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1575 14.1227 7.49985 14.1227C3.84216 14.1227 0.877014 11.1575 0.877014 7.49988ZM7.49985 1.82704C4.36683 1.82704 1.82701 4.36686 1.82701 7.49988C1.82701 8.97196 2.38774 10.3131 3.30727 11.3213C4.19074 9.94119 5.73818 9.02499 7.50023 9.02499C9.26206 9.02499 10.8093 9.94097 11.6929 11.3208C12.6121 10.3127 13.1727 8.97172 13.1727 7.49988C13.1727 4.36686 10.6328 1.82704 7.49985 1.82704ZM10.9818 11.9787C10.2839 10.7795 8.9857 9.97499 7.50023 9.97499C6.01458 9.97499 4.71624 10.7797 4.01845 11.9791C4.97952 12.7272 6.18765 13.1727 7.49985 13.1727C8.81227 13.1727 10.0206 12.727 10.9818 11.9787ZM5.14999 6.50487C5.14999 5.207 6.20212 4.15487 7.49999 4.15487C8.79786 4.15487 9.84999 5.207 9.84999 6.50487C9.84999 7.80274 8.79786 8.85487 7.49999 8.85487C6.20212 8.85487 5.14999 7.80274 5.14999 6.50487ZM7.49999 5.10487C6.72679 5.10487 6.09999 5.73167 6.09999 6.50487C6.09999 7.27807 6.72679 7.90487 7.49999 7.90487C8.27319 7.90487 8.89999 7.27807 8.89999 6.50487C8.89999 5.73167 8.27319 5.10487 7.49999 5.10487Z'
                        fill='currentColor'
                      />
                    </svg>
                    {item.author}
                  </div>
                  <span className='flex items-center gap-[2px]  font-[500] text-[#637381] text-xs'>
                    <svg
                      stroke='currentColor'
                      fill='currentColor'
                      strokeWidth='0'
                      viewBox='0 0 24 24'
                      className='text-blue-500'
                      height='15'
                      width='15'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path fill='none' d='M0 0h24v24H0V0z' />
                      <path d='M7 11h2v2H7v-2zm14-5v14c0 1.1-.9 2-2 2H5a2 2 0 01-2-2l.01-14c0-1.1.88-2 1.99-2h1V2h2v2h8V2h2v2h1c1.1 0 2 .9 2 2zM5 8h14V6H5v2zm14 12V10H5v10h14zm-4-7h2v-2h-2v2zm-4 0h2v-2h-2v2z' />
                    </svg>
                    {item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy') : 'Không xác định'}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default RelatedArticles;
