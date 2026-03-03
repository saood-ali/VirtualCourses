import { useSelector } from "react-redux";
import ReviewCard from "./ReviewCard.jsx";

function ReviewPage() {
    const {reviewData} = useSelector(state=>state.review);
    const latestReview = reviewData?.slice(0, 6) || [];
  return (
    <div className="flex items-center justify-center flex-col">
      <h1 className="md:text-[45px] text-[30px] font-semibold text-center mt-[30px] px-[20px]">
        Real Reviews for real courses
      </h1>
      <span className="lg:w-[50%] md:w-[80%] text-[15px] text-center mt-[30px] mb-[30px] px-[20px]">
        Discover how our Virtual Courses is transforming learning experiences
        through real feedback from students and professionals worldwide.
      </span>
      <div className="w-full min-[100vh] flex items-center justify-center flex-wrap gap-[50px] lg:p-[50px] 
      md:p-[30px] p-[10px] mb-[40px] cursor-pointer">
       {
        latestReview?.map((review,index)=>(
            <ReviewCard key={index} comment={review.comment} rating={review.rating} photoUrl={review.user?.photoUrl} 
                courseTitle={review.course?.title} courseId={review.course?._id} name={review.user?.name} description={review.user?.description}
            />
        ))
       }
      </div>
    </div>
  );
}

export default ReviewPage;
