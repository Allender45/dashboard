type IframeSlideProps = {
    src: string;
    title?: string;
};

/**
 * Слайд-фрейм: показывает внешний сайт как есть.
 * Iframe перемонтируется при каждом показе слайда,
 * поэтому страница внутри всегда загружается со свежими данными.
 */
export function IframeSlide({ src, title = "Внешняя страница" }: IframeSlideProps) {
    return (
        <div
            className="h-full w-full overflow-hidden rounded-[16px] border border-white/10 bg-[#070b18]"
            data-role="iframe-slide"
        >
            <iframe
                src={src}
                title={title}
                className="block h-full w-full border-0"
            />
        </div>
    );
}