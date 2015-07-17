import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;

/**
 * Created by cdickson on 15-07-17.
 */
public class StitchTorCSV {
    public static void main(String[] args) {
        String inPath = args[0];
        String outfileName = args[1];
        FileReader fr = null;
        FileWriter fw = null;

        File dir = new File(inPath);
        File[] directoryListing = dir.listFiles();
        for (File child : directoryListing) {

        }

        System.out.println("Hello world");
    }
}
