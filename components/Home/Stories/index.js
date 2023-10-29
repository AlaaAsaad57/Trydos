"use client"
import React, { useEffect } from 'react'
import StoryElement from "./StoryElement"
import { useDispatch, useSelector } from 'react-redux'
import { SelectStory } from '../../../redux/homepage/actions'
function index() {
  const storiesData=useSelector((state)=>state.homepage.storiesData)
  const dispatch=useDispatch()
  const setSelectStory=(e)=>{
      dispatch(SelectStory(e))
  }
  const language=useSelector((state)=>state.homepage.language)
const getBorderWidth=()=>{
  let elem=typeof document !== 'undefined' &&document.querySelector(".site-container")
  if(elem?.clientWidth <1443)
  return elem?.clientWidth
else return 1433
}
if (typeof document !== 'undefined'){
  const slider = document?.querySelector('.stories-bars');
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
});}
  return (
    <div className='stories-bar-container' >
            <div id="stories-bar" className='stories-bar'>
            <svg id="stories-border1" className='border' xmlns="http://www.w3.org/2000/svg" width={getBorderWidth()} height="0.5" viewBox={`0 0 ${getBorderWidth()} 0.5`}>
            <line id="Line_1107" data-name="Line 1107" x2={getBorderWidth()} transform="translate(0 0.25)" fill="none" stroke="#3c3c3c" stroke-width="0.5" stroke-dasharray="3 3"/>
            </svg>
            <svg id="stories-border2" className='border' xmlns="http://www.w3.org/2000/svg" width={getBorderWidth()} height="0.5" viewBox={`0 0 ${getBorderWidth()} 0.5`}>
            <line id="Line_1107" data-name="Line 1107" x2={getBorderWidth()} transform="translate(0 0.25)" fill="none" stroke="#3c3c3c" stroke-width="0.5" stroke-dasharray="3 3"/>
            </svg>
            <div className='stories-bars' aria-details={language}>
            {storiesData.map((story,index)=>(
                          <StoryElement key={index}  story={story} stories={story} viewedStory={story.stories[0]} select={(e)=>setSelectStory(e)} />
            ))}
            </div>
          
            </div>

    </div>

  )
}

export default index