import NextLink from "components/global/NextLink";

function OrderPlaced({ data }) {
    return (
        <NextLink
            className="flex-row"
            href={`/myProfile/orders`}
            prefetch
        >
            <div className="flex-col m-2">
                <div className="regular p-2">{data.description}</div>
            </div>
        </NextLink>
    );
}

export default OrderPlaced;
