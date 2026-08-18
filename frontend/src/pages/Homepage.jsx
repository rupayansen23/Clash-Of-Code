import { LogoutButton } from "../components/LogoutButton";

export default function HomePage() {
    return(
        <div className="p-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Homepage</h1>
                <LogoutButton />
            </div>
        </div>
    );
}