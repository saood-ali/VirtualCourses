import { useSelector } from "react-redux";
import Card from "./Card.jsx";

function CardPage() {
    const {courseData} = useSelector(state=>state.course);
    const popularCourses = courseData?.slice(0,6) || [];
  return (
    <div className="relative flex items-center justify-center flex-col">
      <h1 className="md:text-[45px] text-[30px] font-semibold text-center
      mt-[30px] px-[20px]">Our Popular Courses</h1>
      <span className="lg:w-[50%] md:w-[80%] text-[15px] text-center 
      mt-[30px] mb-[30px] px-[20px]">
        Explore top rated courses designed to boost your skills, enhance
        careers, and unlock opportunities in tech, AI, businesses, and beyond.
      </span>
      <div className="w-full flex items-center justify-center 
      flex-wrap gap-[50px] lg:p-[50px] md:p-[30px] p-[10px] mb-[40px]">
       {
        popularCourses?.map((course,index)=>(
            <Card key={index} thumbnail={course.thumbnail} title={course.title}
                category={course.category} price={course.price} id={course._id} reviews={course.reviews}/>
        ))
       }
      </div>
    </div>
  );
}

export default CardPage;
