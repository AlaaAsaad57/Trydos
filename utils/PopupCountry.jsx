import React, {useEffect, useState} from "react";
import Cookies from "js-cookie";
import {usePathname} from "next/navigation";

const countriesString = process.env.NEXT_PUBLIC_COUNTRIES || "[]";
const countries = JSON.parse(countriesString);

const _getCountryName = (code) => {
    switch (code) {
        case "tr":
            return "Turkey"
        case "us":
            return "United States Of America"
        case "sy":
            return "Syria"
        case "ae":
            return "United Arab Emirates"
    }
}
const options = countries.map((country) => {
        return {
            label: _getCountryName(country), value: country
        }
    }
)
const PopupCountry = ({originCountry, setLocalization, localization}) => {
    const pathname = usePathname()
    const {isSupported, country, countryName} = originCountry
    const [selectedCountry, setSelectedCountry] = useState(null)

    useEffect(() => {
        if (selectedCountry) {
            setLocalization({...localization, country: selectedCountry})
            // const originCountryJSON = {
            //     countryName, country, isSupported: true
            // }
            Cookies.remove("origin-country");
            const aa = setTimeout(() => {
                const urlWithoutLang = `${window.location.href}`.replace(`${pathname}`, '')
                window.location.replace(urlWithoutLang)
            }, 1000)
        }
    }, [selectedCountry]);
    return (
        <div
            className={`${!isSupported ? "flex" : "hidden"} fixed items-center justify-center z-[99999] inset-0 bg-slate-700 bg-opacity-50`}>
            <div
                className={`${!isSupported ? "translate-y-0" : "translate-y-full"}
                transform-cpu duration-1000 delay-1000 w-max
                fixed flex-col gap-y-5 rounded-[20px] top-[10%]
                flex text-center items-center justify-center px-4 py-8 bg-gray-100`}>
        <span className="capitalize text-center font-bold text-dark text-base px-10">
          {countryName || "Your Country"}
            <div className="font-medium text-red-500">Is Not Supported In Our System</div>
        </span>
                <select
                    value={selectedCountry}
                    onChange={(e) => {
                        setSelectedCountry(e.target.value)
                    }}
                    className={`w-full disabled:bg-gray-300 py-3.5 flex items-center justify-start bg-white text-sm text-gray-500
              border-[0.1px]  rounded-lg`}
                >
                    <option
                        style={{
                            marginBottom: 100,
                        }}
                        className="!p-10 inline-block"
                    >
                        Please Select a Supported Country
                    </option>
                    {options?.map((country, index) => {
                        return (
                            <option
                                key={index}
                                style={{
                                    marginBottom: 100,
                                }}
                                className="!p-10 inline-block"
                                value={country.value}
                            >
                                {country.label}
                            </option>
                        );
                    })}
                </select>
            </div>
        </div>

    )
}
export default PopupCountry