import { GoStarFill } from "react-icons/go";
import { CiStar } from "react-icons/ci";
import { useNavigate } from "react-router-dom";

function ReviewCard({comment, rating ,photoUrl ,name ,description, courseTitle, courseId}) {
  const navigate = useNavigate();
  return (
    <div className='bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 max-w-sm w-full'>
      <div className='flex items-center mb-3 text-yellow-400 text-sm'>
        {
            Array(5).fill(0).map((_,i)=>(
                <span key={i}>
                    {i<rating ? <GoStarFill/> : <CiStar />}
                </span>
            ))
        }
      </div>
      <p className='text-gray-700 text-sm mb-3'>Review for:{" "} 
        {courseTitle && courseId ? (
          <span 
            className='font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors duration-200'
            onClick={() => navigate(`/course/${courseId}`)}
          >
            {courseTitle}
          </span>
        ) : (
          <span className='font-semibold text-gray-500 italic'>Course Unavailable</span>
        )}
      </p>
      <p className='text-gray-700 text-sm mb-5'>Review: <span className='font-semibold'>{comment}</span></p>
      <div className='flex items-center gap-2'>
        <img src={photoUrl} alt="" className='w-10 h-10 rounded-full object-cover'/>
        <div>
        <h2 className='font-semibold text-gray-800 text-sm '>{name}</h2>
        <p className='text-xs text-gray-500'>{description}</p>
        </div>
      </div>
    </div>
  )
}

export default ReviewCard