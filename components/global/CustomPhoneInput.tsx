function CustomPhoneInput({ ...props }) {
  return (
    <input
      // @ts-ignore
      tabIndex="-1"
      enterKeyHint="done"
      type="number"
      autoFocus={false}
      inputMode="numeric"
      data-testid="phone-number-input"
      id="phoneInput"
      aria-autocomplete="both"
      aria-haspopup="false"
      spellCheck="false"
      placeholder="XXX XXX XXX XXX"
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      {...props}
      value={props.value}
      onChange={(e) => {
        props.setValue(e.target.value);
      }}
    />
  );
}

export default CustomPhoneInput;
