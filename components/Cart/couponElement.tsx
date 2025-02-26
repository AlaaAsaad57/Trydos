import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AxiosGet } from "utils/AxiosApi";
import { getCart, RoundPrice } from "utils/functions";

const CouponElement = ({ active, setActive, close }) => {
    const dispatch = useDispatch();

    const coupon_number = useSelector(
        (state: StateInterface) => state.cart.orderData.coupon_number
    );
    const coupon_discount = useSelector(
        (state: StateInterface) => state.cart.coupon_discount
    );
    const currency = useSelector(
        (state: StateInterface) => state.homepage.currency
    ) || { exchange_rate: 1, symbol: "" };

    const [coupon, setCoupon] = useState<number | false>(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (coupon_discount && coupon_discount > 0 && !active) {
            setCoupon(coupon_discount);
            setActive(true);
        }
    }, [coupon_discount, active, setActive]);

    const onChange = (e) => {
        dispatch({ type: "ORDER-DATA", payload: { coupon_number: e } });
    };

    const applyCoupon = async () => {
        if (!coupon_number) return;
        if (coupon) return;
        setLoading(true);
        setError("");

        try {
            const response = await AxiosGet({
                url: process.env.NEXT_PUBLIC_BACKEND_URL + `/coupon/apply?code=${coupon_number}`,
                title: "apply coupon request"
            });

            if (!response.status) {
                throw new Error("Invalid coupon code");
            }

            getCart({
                callback: ([data]) => {
                    dispatch({ type: "CART-INIT", payload: data ?? { cart: [] } });
                },
            });

            setCoupon(response.discount);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            onClick={(e) => {
                if (!(e.target as Element).closest(".apply-button")) {
                    setActive();
                }
            }}
            style={{ border: active ? "1px solid rgb(56 144 255 / 51%)" : undefined }}
            className={`w-full cursor-pointer pt-[12px] mt-[30px] ${active ? "h-[111px] bg-[#fff]" : " h-[42px] bg-[#f8f8f8]"
                } rounded-[15px] flex-col items-start px-[12px]`}
        >
            <div className="flex-row ">
                <div className="regular text-[#1D1D1D] text-[14px] ml-2">
                    I Have a Discount Coupon
                </div>
            </div>

            {active && (
                <>
                    <div className="regular text-[12px] text-[#8D8D8D] ml-[28px]">
                        Please Enter Coupon Information
                    </div>
                    <div className="mt-[10px] w-full items-center justify-between flex rounded-[15px] h-[40px] bg-[#F8F8F8] relative">
                        <div className="flex-row items-center w-full">
                            {!coupon && (
                                <input
                                    placeholder="Coupon No"
                                    value={coupon_number}
                                    onChange={(e) => onChange(e.target.value)}
                                    onBlur={(e) => {
                                        if (!e.target.value) close();
                                    }}
                                    className="coupon-element-input pl-[12px] bg-transparent w-full h-[42px] border-none outline-none text-[#1D1D1D] text-[12px] placeholder:text-[#C4C2C2]"
                                />
                            )}
                            <div
                                className={`transition-all text-[#1d1d1d] apply-button ${coupon ? "min-w-full" : "w-[100px] min-w-[100px]"
                                    } flex items-center justify-center h-[40px] rounded-[15px] bg-white`}
                                style={{ border: "1px solid rgb(56 144 255 / 51%)" }}
                                onClick={applyCoupon}
                            >
                                {loading
                                    ? "Applying..."
                                    : coupon
                                        ? `- ${RoundPrice({ num: coupon })} ${currency.symbol}`
                                        : "Apply"}
                            </div>
                        </div>
                    </div>
                    {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
                </>
            )}
        </div>
    );
};

export default CouponElement;
