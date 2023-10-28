import React, { useEffect } from 'react'
import StoryElement from "./StoryElement"
import { useSelector } from 'react-redux'
function index() {
  const language=useSelector((state)=>state.homepage.language)
const getBorderWidth=()=>{
  let elem=document.querySelector(".site-container")
  if(elem?.clientWidth <1443)
  return elem?.clientWidth
else return 1433
}
const slider = document.querySelector('.stories-bars');
let isDown = false;
let startX;
let scrollLeft;

slider?.addEventListener('mousedown', (e) => {
  isDown = true;
  slider.classList.add('active');
  startX = e.pageX - slider.offsetLeft;
  scrollLeft = slider.scrollLeft;
});
slider?.addEventListener('mouseleave', () => {
  isDown = false;
  slider.classList.remove('active');
});
slider?.addEventListener('mouseup', () => {
  isDown = false;
  slider.classList.remove('active');
});
slider?.addEventListener('mousemove', (e) => {
  if(!isDown) return;
  e.preventDefault();
  const x = e.pageX - slider.offsetLeft;
  const walk = (x - startX) * 3; //scroll-fast
  slider.scrollLeft = scrollLeft - walk;
});
  return (
    <div className='stories-bar-container'>
            <div id="stories-bar" className='stories-bar'>
            <svg id="stories-border1" className='border' xmlns="http://www.w3.org/2000/svg" width={getBorderWidth()} height="0.5" viewBox={`0 0 ${getBorderWidth()} 0.5`}>
            <line id="Line_1107" data-name="Line 1107" x2={getBorderWidth()} transform="translate(0 0.25)" fill="none" stroke="#3c3c3c" stroke-width="0.5" stroke-dasharray="3 3"/>
            </svg>
            <svg id="stories-border2" className='border' xmlns="http://www.w3.org/2000/svg" width={getBorderWidth()} height="0.5" viewBox={`0 0 ${getBorderWidth()} 0.5`}>
            <line id="Line_1107" data-name="Line 1107" x2={getBorderWidth()} transform="translate(0 0.25)" fill="none" stroke="#3c3c3c" stroke-width="0.5" stroke-dasharray="3 3"/>
            </svg>
            <div className='stories-bars' aria-details={language}>
            <StoryElement/>
            <StoryElement/>
            <StoryElement/>
            <StoryElement/>
            <StoryElement/>
            <StoryElement/>
            <StoryElement/>
            <StoryElement/>
            <StoryElement/>
            <StoryElement/>
            <StoryElement/>
            <StoryElement/>
            <StoryElement/>
            <StoryElement/>
            <StoryElement/>
            <StoryElement/>
            </div>
          
            </div>

    </div>

  )
}

export default index