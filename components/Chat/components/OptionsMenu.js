import React, { useState } from "react";
import ReplyIcon from "../svg/rep.svg";
import CopyIcon from "../svg/copy.svg";
import CategoryIcon from "../svg/categ.svg";
import DeleteIcon from "../svg/delt.svg";
import EditIcon from "../svg/edit.svg";
import ForwardIcon from "../svg/forward.svg";
import RemindIcon from "../svg/remind.svg";
import { translate } from "utils/functions";
import { useSelector } from "react-redux";
function OptionsMenu(props) {
  const language = useSelector((state) => state.homepage.language);
  const { DeleteModal, setDelete } = props;
  return (
    <div className="abs-menu">
      {DeleteModal ? (
        <>
          <div className="message-ops">
            <div
              className="message-opt"
              style={{ width: "90px", height: "35px" }}
              onClick={() => props.deleteMessage(false)}
            >
              For Me
            </div>
            <span
              style={{
                minHeight: "30px",
                borderRight: "1px solid #5d5d5da2",
                marginLeft: "5px",
              }}
            />
            <div
              className="message-opt"
              style={{ width: "90px", height: "35px" }}
              onClick={() => props.deleteMessage(true)}
            >
              For All
            </div>
            <span
              style={{
                minHeight: "30px",
                borderRight: "1px solid #5d5d5da2",
                marginLeft: "3px",
              }}
            />
            <div
              className="message-opt"
              style={{ width: "90px", height: "35px", marginLeft: "3px" }}
              onClick={() => setDelete(false)}
            >
              Cancel
            </div>
          </div>
        </>
      ) : (
        <>
          {" "}
          <div className="reply-but" onClick={() => props.click()}>
            <ReplyIcon></ReplyIcon>
            <div className="rep-descs" style={{ bottom: "-34px" }}>
              {translate("Reply", language)}
            </div>
          </div>
          <div className="message-ops">
            <div className="message-opt" onClick={() => props.forward()}>
              <ForwardIcon></ForwardIcon>
              <div className="rep-descs">{translate("Forward", language)}</div>
            </div>
            <div className="message-opt" onClick={() => props.copy()}>
              <CopyIcon></CopyIcon>
              <div className="rep-descs">{translate("Copy", language)}</div>
            </div>
            <div className="message-opt">
              <CategoryIcon></CategoryIcon>
              <div className="rep-descs">
                {translate("CategoryMessage", language)}
              </div>
            </div>
            <div
              className="message-opt"
              onClick={() => {
                setDelete(true);
              }}
            >
              <DeleteIcon></DeleteIcon>
              <div className="rep-descs">{translate("Delete", language)}</div>
            </div>
            <div className="message-opt">
              <EditIcon></EditIcon>
              <div className="rep-descs">{translate("Edit", language)}</div>
            </div>
            <div className="message-opt">
              <RemindIcon></RemindIcon>
              <div className="rep-descs">{translate("Reminder", language)}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default OptionsMenu;
