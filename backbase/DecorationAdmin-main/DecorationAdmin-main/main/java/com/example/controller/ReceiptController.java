package com.example.controller;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.io.IoUtil;
import cn.hutool.poi.excel.ExcelUtil;
import cn.hutool.poi.excel.ExcelWriter;
import com.example.common.Result;
import com.example.entity.CustomerRep;
import com.example.entity.Receipt;
import com.example.service.CustomerRepService;
import com.example.service.ReceiptService;
import com.example.entity.User;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.springframework.web.bind.annotation.*;
import com.example.exception.CustomException;
import cn.hutool.core.util.StrUtil;

import javax.annotation.Resource;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.util.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/receipt")
public class ReceiptController {
    @Resource
    private ReceiptService receiptService;
    @Resource
    private HttpServletRequest request;

    public User getUser() {
        User user = (User) request.getSession().getAttribute("user");
        if (user == null) {
            throw new CustomException("-1", "请登录");
        }
        return user;
    }

    @PostMapping
    public Result<?> save(@RequestBody Receipt receipt) {
        return Result.success(receiptService.save(receipt));
    }

    @PutMapping
    public Result<?> update(@RequestBody Receipt receipt) {
        return Result.success(receiptService.updateById(receipt));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        receiptService.removeById(id);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<?> findById(@PathVariable Long id) {
        return Result.success(receiptService.getById(id));
    }

    @GetMapping
    public Result<?> findAll() {
        return Result.success(receiptService.list());
    }

    @GetMapping("/page")
    public Result<?> findPage(@RequestParam(required = false, defaultValue = "") String name,
                                                @RequestParam(required = false, defaultValue = "1") Integer pageNum,
                                                @RequestParam(required = false, defaultValue = "10") Integer pageSize) {
        LambdaQueryWrapper<Receipt> query = Wrappers.<Receipt>lambdaQuery().orderByDesc(Receipt::getId);
        if (StrUtil.isNotBlank(name)) {
            query.like(Receipt::getName, name);
        }
        return Result.success(receiptService.page(new Page<>(pageNum, pageSize), query));
    }

    @GetMapping("/export")
    public void export(HttpServletResponse response) throws IOException {

        List<Map<String, Object>> list = CollUtil.newArrayList();

        List<Receipt> all = receiptService.list();
        for (Receipt obj : all) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("收款日期", obj.getDate());
            row.put("收款id", obj.getId());
            row.put("收款金额", obj.getMoney());
            row.put("备用", obj.getName());
            row.put("项目代码", obj.getProjectid());

            list.add(row);
        }

        // 2. 写excel
        ExcelWriter writer = ExcelUtil.getWriter(true);
        writer.write(list, true);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
        String fileName = URLEncoder.encode("收款登记信息", "UTF-8");
        response.setHeader("Content-Disposition", "attachment;filename=" + fileName + ".xlsx");

        ServletOutputStream out = response.getOutputStream();
        writer.flush(out, true);
        writer.close();
        IoUtil.close(System.out);
    }

    @GetMapping("/upload/{fileId}")
    public Result<?> upload(@PathVariable String fileId) {
        String basePath = System.getProperty("user.dir") + "/src/main/resources/static/file/";
        List<String> fileNames = FileUtil.listFileNames(basePath);
        String file = fileNames.stream().filter(name -> name.contains(fileId)).findAny().orElse("");
        List<List<Object>> lists = ExcelUtil.getReader(basePath + file).read(1);
        List<Receipt> saveList = new ArrayList<>();
        for (List<Object> row : lists) {
            Receipt obj = new Receipt();
            obj.setDate((String) row.get(1));
            obj.setMoney(Integer.valueOf((String) row.get(2)));
            obj.setName((String) row.get(3));
            obj.setProjectid(Integer.valueOf((String) row.get(4)));

            saveList.add(obj);
        }
        receiptService.saveBatch(saveList);
        return Result.success();
    }


//    @Resource
//    private CustomerRepService customerRepService;
//    @GetMapping("/generate")
//    public Result<CustomerRep> generate(@RequestParam(required=false,defaultValue = "") String id)
//    {
//        long l=Long.parseLong(id);
//        return Result.success(customerRepService.generate(l));
//    }

}
